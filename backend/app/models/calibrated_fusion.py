from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import accuracy_score, f1_score, brier_score_loss, confusion_matrix
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, List
from app.config import MODELS_DIR
import logging

logger = logging.getLogger("trustsense.models.fusion")
MODEL_PATH = MODELS_DIR / "calibrated_fusion.joblib"

FUSION_FEATURE_NAMES = [
    "rf_fault_prob",
    "autoencoder_norm_error",
    "iso_forest_anom_score",
    "ref_pulse_deviation",
    "ref_response_deviation"
]

class CalibratedEvidenceFusionClassifier:
    """
    Model 7: Calibrated Evidence-Fusion Meta-Classifier.
    Synthesizes diverse diagnostic outputs into a unified, uncertainty-aware reliability state.
    """
    def __init__(self):
        # Base meta-estimator with Platt scaling calibration
        base_lr = LogisticRegression(C=1.0, solver="lbfgs", max_iter=200, random_state=42)
        self.calibrated_meta = CalibratedClassifierCV(estimator=base_lr, method="sigmoid", cv="prefit")
        self.raw_meta = base_lr
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.load()

    def construct_meta_features(self,
                                rf_probs: np.ndarray,
                                ae_errors: np.ndarray,
                                ae_threshold: float,
                                iso_scores: np.ndarray,
                                X_raw_features: np.ndarray) -> np.ndarray:
        """
        Transforms heterogeneous base-model outputs into standardized meta-features.
        None of the raw outputs are treated as interchangeable probabilities.
        """
        n = len(rf_probs)
        # 1. Random forest fault probability [0, 1]
        f1 = rf_probs.reshape(n, 1)

        # 2. Autoencoder error normalized relative to validation threshold
        # Ratio: > 1.0 means exceeding nominal healthy reconstruction limit
        f2 = np.clip(ae_errors / (ae_threshold + 1e-6), 0.0, 5.0).reshape(n, 1)

        # 3. Isolation forest normalized anomaly score [0, 1]
        f3 = iso_scores.reshape(n, 1)

        # 4. Physical deviation indicators from feature vectors (cols 11 & 14 in engineered pipeline)
        # diff_response_time (col 11) and diff_pulse_curve (col 14)
        if X_raw_features.shape[1] >= 15:
            f4 = np.abs(X_raw_features[:, 11]).reshape(n, 1)
            f5 = np.abs(X_raw_features[:, 14]).reshape(n, 1)
        else:
            f4 = np.zeros((n, 1))
            f5 = np.zeros((n, 1))

        meta_X = np.hstack([f1, f2, f3, f4, f5])
        return meta_X

    def train_fusion(self,
                     X_val_meta: np.ndarray, y_val_faulty: np.ndarray,
                     X_test_meta: np.ndarray, y_test_faulty: np.ndarray) -> Dict[str, Any]:
        """
        Trains meta-classifier on validation set (out-of-fold from train set)
        and calibrates probabilities. Evaluates on test split.
        """
        logger.info(f"Training Evidence-Fusion Meta-Classifier on {len(X_val_meta)} validation samples...")
        self.raw_meta.fit(X_val_meta, y_val_faulty)
        self.calibrated_meta.fit(X_val_meta, y_val_faulty)
        self.is_trained = True

        # Test evaluation
        test_probs = self.calibrated_meta.predict_proba(X_test_meta)[:, 1]
        test_preds = (test_probs >= 0.50).astype(int)

        acc = float(accuracy_score(y_test_faulty, test_preds))
        f1 = float(f1_score(y_test_faulty, test_preds, zero_division=0))
        brier = float(brier_score_loss(y_test_faulty, test_probs))
        cm = confusion_matrix(y_test_faulty, test_preds).tolist()

        # Calibration curve
        prob_true, prob_pred = calibration_curve(y_test_faulty, test_probs, n_bins=10, strategy="uniform")
        calib_data = [{"prob_pred": float(p), "prob_true": float(t)} for p, t in zip(prob_pred, prob_true)]

        # Meta-weights (from raw logistic regression)
        coefs = self.raw_meta.coef_[0]
        component_weights = {
            name: float(w) for name, w in zip(FUSION_FEATURE_NAMES, coefs)
        }

        self.metrics = {
            "model_type": "Calibrated Evidence-Fusion Meta-Classifier (Platt-Calibrated LR)",
            "accuracy": acc,
            "f1_score": f1,
            "brier_score": brier,
            "confusion_matrix": cm,
            "component_meta_weights": component_weights,
            "calibration_curve": calib_data,
            "test_sample_count": len(y_test_faulty),
            "design_note": "Fuses supervised probability, autoencoder reconstruction ratio, isolation forest score, and physical reference deviations."
        }

        joblib.dump({
            "raw_meta": self.raw_meta,
            "calibrated_meta": self.calibrated_meta,
            "metrics": self.metrics
        }, MODEL_PATH)

        logger.info(f"Fusion Classifier trained. F1: {f1:.4f}, Brier: {brier:.4f}")
        return self.metrics

    def predict_fusion(self, X_meta: np.ndarray, uncertainty_margin: float = 0.15) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Returns:
        - predictions: 0 (healthy), 1 (faulty)
        - calibrated_probs: P(faulty | evidence) in [0, 1]
        - is_uncertain: boolean flag if probability is near boundary (0.50 +/- uncertainty_margin)
        """
        if not self.is_trained:
            raise RuntimeError("Evidence Fusion Classifier is not trained.")
        cal_probs = self.calibrated_meta.predict_proba(X_meta)[:, 1]
        preds = (cal_probs >= 0.50).astype(int)
        
        # Uncertainty: near decision boundary [0.5 - margin, 0.5 + margin]
        is_uncertain = np.abs(cal_probs - 0.50) < uncertainty_margin
        return preds, cal_probs, is_uncertain

    def load(self) -> bool:
        if MODEL_PATH.exists():
            try:
                data = joblib.load(MODEL_PATH)
                self.raw_meta = data["raw_meta"]
                self.calibrated_meta = data["calibrated_meta"]
                self.metrics = data.get("metrics", {})
                self.is_trained = True
                return True
            except Exception as e:
                logger.warning(f"Could not load Fusion model: {e}")
        return False
