from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score,
    recall_score, f1_score, matthews_corrcoef, roc_auc_score,
    confusion_matrix
)
from sklearn.calibration import calibration_curve
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from app.config import MODELS_DIR
from app.feature_pipeline import FEATURE_COLUMNS
import logging

logger = logging.getLogger("trustsense.models.rf")

MODEL_PATH = MODELS_DIR / "random_forest.joblib"

class RandomForestSensorModel:
    """Model 1: Random Forest Classifier for healthy vs suspected faulty sensor windows."""
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1,
            class_weight="balanced"
        )
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.load()

    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """Train model on training split and evaluate on held-out test split."""
        logger.info(f"Training Random Forest on {len(X_train)} samples...")
        self.model.fit(X_train, y_train)
        self.is_trained = True

        # Test evaluation
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]

        cm = confusion_matrix(y_test, y_pred).tolist()
        acc = float(accuracy_score(y_test, y_pred))
        bal_acc = float(balanced_accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        mcc = float(matthews_corrcoef(y_test, y_pred))
        try:
            roc_auc = float(roc_auc_score(y_test, y_prob))
        except Exception:
            roc_auc = 0.5

        # Feature importances
        importances = {
            col: float(imp)
            for col, imp in zip(FEATURE_COLUMNS, self.model.feature_importances_)
        }
        # Sort desc
        importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

        # Calibration curve
        prob_true, prob_pred = calibration_curve(y_test, y_prob, n_bins=8, strategy="uniform")
        calib = [{"pred": float(p), "true": float(t)} for p, t in zip(prob_pred, prob_true)]

        self.metrics = {
            "accuracy": acc,
            "balanced_accuracy": bal_acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "mcc": mcc,
            "roc_auc": roc_auc,
            "confusion_matrix": cm,
            "feature_importance": importances,
            "calibration_curve": calib,
            "test_sample_count": len(y_test),
            "class_distribution_test": {
                "healthy_0": int((y_test == 0).sum()),
                "faulty_1": int((y_test == 1).sum())
            }
        }

        # Save artifact
        joblib.dump({"model": self.model, "metrics": self.metrics}, MODEL_PATH)
        logger.info(f"Random Forest trained. Test F1: {f1:.4f}, Bal Acc: {bal_acc:.4f}")
        return self.metrics

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Returns predictions and probabilities of fault [0, 1]."""
        if not self.is_trained:
            raise RuntimeError("Random Forest model is not trained.")
        y_pred = self.model.predict(X)
        y_prob = self.model.predict_proba(X)[:, 1]
        return y_pred, y_prob

    def load(self) -> bool:
        if MODEL_PATH.exists():
            try:
                data = joblib.load(MODEL_PATH)
                self.model = data["model"]
                self.metrics = data.get("metrics", {})
                self.is_trained = True
                return True
            except Exception as e:
                logger.warning(f"Could not load Random Forest model: {e}")
        return False
