import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, List
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from app.config import MODELS_DIR
from app.feature_pipeline import FEATURE_COLUMNS
import logging

logger = logging.getLogger("trustsense.models.xgboost")
MODEL_PATH = MODELS_DIR / "xgboost_fault.joblib"

# Try importing XGBoost; provide documented fallback if unavailable
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier
    HAS_XGBOOST = False

FAULT_CLASSES = [
    "none",
    "drift",
    "offset",
    "stuck",
    "noise_increase",
    "slow_response",
    "sensitivity_loss"
]

class XGBoostFaultClassifier:
    """Model 2: Multiclass Fault-Type Classifier with XGBoost & GradientBoosting fallback."""
    def __init__(self):
        self.has_xgboost = HAS_XGBOOST
        self.class_names = FAULT_CLASSES
        self.class_to_idx = {name: i for i, name in enumerate(FAULT_CLASSES)}
        self.idx_to_class = {i: name for i, name in enumerate(FAULT_CLASSES)}
        
        if self.has_xgboost:
            self.model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                objective="multi:softprob",
                num_class=len(FAULT_CLASSES),
                random_state=42,
                n_jobs=-1,
                eval_metric="mlogloss"
            )
            self.model_backend_name = "XGBoost (native)"
        else:
            self.model = GradientBoostingClassifier(
                n_estimators=80,
                max_depth=5,
                random_state=42
            )
            self.model_backend_name = "GradientBoostingClassifier (Fallback)"

        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.load()

    def train(self, X_train: np.ndarray, y_train_labels: np.ndarray,
              X_test: np.ndarray, y_test_labels: np.ndarray) -> Dict[str, Any]:
        """Train multiclass classifier on training split and evaluate on held-out test split."""
        y_train_idx = np.array([self.class_to_idx.get(str(label).strip(), 0) for label in y_train_labels])
        y_test_idx = np.array([self.class_to_idx.get(str(label).strip(), 0) for label in y_test_labels])

        logger.info(f"Training {self.model_backend_name} on {len(X_train)} samples across {len(FAULT_CLASSES)} classes...")
        self.model.fit(X_train, y_train_idx)
        self.is_trained = True

        # Test evaluation
        y_pred_idx = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)

        acc = float(accuracy_score(y_test_idx, y_pred_idx))
        macro_f1 = float(f1_score(y_test_idx, y_pred_idx, average="macro", zero_division=0))
        cm = confusion_matrix(y_test_idx, y_pred_idx, labels=list(range(len(FAULT_CLASSES)))).tolist()

        # Classification report
        rep = classification_report(
            y_test_idx, y_pred_idx,
            labels=list(range(len(FAULT_CLASSES))),
            target_names=FAULT_CLASSES,
            output_dict=True,
            zero_division=0
        )

        # Feature importances
        if hasattr(self.model, "feature_importances_"):
            importances = {
                col: float(imp)
                for col, imp in zip(FEATURE_COLUMNS, self.model.feature_importances_)
            }
            importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))
        else:
            importances = {}

        self.metrics = {
            "model_type": self.model_backend_name,
            "accuracy": acc,
            "macro_f1": macro_f1,
            "classes": FAULT_CLASSES,
            "confusion_matrix": cm,
            "per_class_metrics": {c: rep.get(c, {}) for c in FAULT_CLASSES},
            "feature_importance": importances,
            "test_sample_count": len(y_test_idx)
        }

        # Save artifact
        joblib.dump({
            "model": self.model,
            "metrics": self.metrics,
            "model_backend_name": self.model_backend_name
        }, MODEL_PATH)

        logger.info(f"{self.model_backend_name} trained. Accuracy: {acc:.4f}, Macro-F1: {macro_f1:.4f}")
        return self.metrics

    def predict(self, X: np.ndarray, uncertainty_threshold: float = 0.40) -> Tuple[List[str], np.ndarray, np.ndarray]:
        """Predict fault types with uncertainty rejection if max prob < threshold."""
        if not self.is_trained:
            raise RuntimeError("XGBoost Fault Classifier is not trained.")
        probs = self.model.predict_proba(X)
        pred_indices = np.argmax(probs, axis=1)
        max_probs = np.max(probs, axis=1)

        pred_labels = []
        is_uncertain = []
        for idx, max_p in zip(pred_indices, max_probs):
            if max_p < uncertainty_threshold:
                pred_labels.append("uncertain")
                is_uncertain.append(True)
            else:
                pred_labels.append(self.idx_to_class[idx])
                is_uncertain.append(False)

        return pred_labels, probs, np.array(is_uncertain)

    def load(self) -> bool:
        if MODEL_PATH.exists():
            try:
                data = joblib.load(MODEL_PATH)
                self.model = data["model"]
                self.metrics = data.get("metrics", {})
                self.model_backend_name = data.get("model_backend_name", self.model_backend_name)
                self.is_trained = True
                return True
            except Exception as e:
                logger.warning(f"Could not load XGBoost model: {e}")
        return False
