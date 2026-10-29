from sklearn.ensemble import IsolationForest
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from app.config import MODELS_DIR
import logging

logger = logging.getLogger("trustsense.models.isolation_forest")
MODEL_PATH = MODELS_DIR / "isolation_forest.joblib"

class IsolationForestSensorModel:
    """Model 4: Unsupervised Isolation Forest for novelty, out-of-distribution, and anomaly detection."""
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.15,
            random_state=42,
            n_jobs=-1
        )
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.load()

    def train(self, X_train: np.ndarray, X_test: np.ndarray, y_test_faulty: np.ndarray) -> Dict[str, Any]:
        logger.info(f"Training Isolation Forest on {len(X_train)} samples...")
        self.model.fit(X_train)
        self.is_trained = True

        # Decision function: lower values mean more anomalous
        test_scores = self.model.decision_function(X_test)
        # Normalize score into roughly [0, 1] where 1 is highly anomalous
        # decision_function is around [-0.5, 0.5] with lower = anomaly
        norm_scores = 1.0 / (1.0 + np.exp(test_scores * 5.0))
        preds = self.model.predict(X_test)  # -1 for anomaly, 1 for normal
        is_anom = (preds == -1).astype(int)

        # Evaluate against labels
        tp = int(np.sum((is_anom == 1) & (y_test_faulty == 1)))
        fp = int(np.sum((is_anom == 1) & (y_test_faulty == 0)))
        tn = int(np.sum((is_anom == 0) & (y_test_faulty == 0)))
        fn = int(np.sum((is_anom == 0) & (y_test_faulty == 1)))

        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        far = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        self.metrics = {
            "model_type": "Isolation Forest (Unsupervised)",
            "n_estimators": 100,
            "contamination_parameter": 0.15,
            "anomaly_recall_vs_faults": recall,
            "false_alarm_rate": far,
            "mean_anomaly_score_normal": float(np.mean(norm_scores[y_test_faulty == 0])),
            "mean_anomaly_score_faulty": float(np.mean(norm_scores[y_test_faulty == 1])) if np.sum(y_test_faulty == 1) > 0 else 0.0,
            "score_distribution_quantiles": {
                "q25": float(np.percentile(norm_scores, 25)),
                "q50": float(np.percentile(norm_scores, 50)),
                "q75": float(np.percentile(norm_scores, 75)),
                "q95": float(np.percentile(norm_scores, 95))
            },
            "interpretation_note": "Unsupervised anomaly detection flags deviations from nominal feature density. Note: severe environmental shifts (e.g. abrupt humidity spikes) can also elevate anomaly scores."
        }

        joblib.dump({"model": self.model, "metrics": self.metrics}, MODEL_PATH)
        logger.info(f"Isolation Forest trained. Recall: {recall:.4f}, FAR: {far:.4f}")
        return self.metrics

    def predict_anomaly(self, X: np.ndarray, sensitivity_threshold: float = 0.6) -> Tuple[np.ndarray, np.ndarray]:
        """Returns boolean anomaly flags and normalized anomaly scores [0, 1]."""
        if not self.is_trained:
            raise RuntimeError("Isolation Forest model is not trained.")
        raw_scores = self.model.decision_function(X)
        norm_scores = 1.0 / (1.0 + np.exp(raw_scores * 5.0))
        is_anom = norm_scores > sensitivity_threshold
        return is_anom, norm_scores

    def load(self) -> bool:
        if MODEL_PATH.exists():
            try:
                data = joblib.load(MODEL_PATH)
                self.model = data["model"]
                self.metrics = data.get("metrics", {})
                self.is_trained = True
                return True
            except Exception as e:
                logger.warning(f"Could not load Isolation Forest model: {e}")
        return False
