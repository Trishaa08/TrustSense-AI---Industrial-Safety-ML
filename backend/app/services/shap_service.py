import joblib
import numpy as np
import shap
from typing import Dict, Any, List, Optional
import logging
from app.config import MODELS_DIR
from app.feature_pipeline import FEATURE_COLUMNS
from app.models.xgboost_fault import FAULT_CLASSES

logger = logging.getLogger("trustsense.shap")

class ShapService:
    """Provides genuine, real-time SHAP local and global explainability for supported models."""
    def __init__(self):
        self._rf_explainer: Optional[shap.TreeExplainer] = None
        self._xgb_explainer: Optional[shap.TreeExplainer] = None
        self._rf_model = None
        self._xgb_model = None

    def _get_rf_explainer(self):
        if self._rf_explainer is None:
            rf_path = MODELS_DIR / "random_forest.joblib"
            if rf_path.exists():
                data = joblib.load(rf_path)
                self._rf_model = data["model"]
                self._rf_explainer = shap.TreeExplainer(self._rf_model)
                logger.info("Initialized TreeExplainer for Random Forest.")
        return self._rf_explainer

    def _get_xgb_explainer(self):
        if self._xgb_explainer is None:
            xgb_path = MODELS_DIR / "xgboost_fault.joblib"
            if xgb_path.exists():
                data = joblib.load(xgb_path)
                self._xgb_model = data["model"]
                self._xgb_explainer = shap.TreeExplainer(self._xgb_model)
                logger.info("Initialized TreeExplainer for XGBoost.")
        return self._xgb_explainer

    def explain_observation(
        self,
        model_id: str,
        feature_dict: Dict[str, float],
        target_class: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates genuine SHAP local feature contributions for the specified observation.
        Strictly prevents fake explanations.
        """
        # Ensure feature alignment with FEATURE_COLUMNS
        feature_vals = [float(feature_dict.get(col, 0.0)) for col in FEATURE_COLUMNS]
        X = np.array(feature_vals, dtype=np.float32).reshape(1, -1)

        # 1. Random Forest Classifier
        if model_id in ["model_1_random_forest", "random_forest"]:
            explainer = self._get_rf_explainer()
            if explainer is None:
                return {"is_shap_supported": False, "error": "Random Forest artifact not found or not trained."}

            shap_vals = explainer.shap_values(X)
            # Shape is (1, n_features, 2) or list of [n_samples, n_features] for classes 0, 1
            if isinstance(shap_vals, list):
                faulty_shap = shap_vals[1][0]
                base_val = float(explainer.expected_value[1]) if isinstance(explainer.expected_value, (list, np.ndarray)) else float(explainer.expected_value)
            elif len(np.shape(shap_vals)) == 3:
                faulty_shap = shap_vals[0, :, 1]
                base_val = float(explainer.expected_value[1]) if hasattr(explainer.expected_value, "__len__") else float(explainer.expected_value)
            else:
                faulty_shap = shap_vals[0]
                base_val = float(explainer.expected_value)

            pred_prob = float(self._rf_model.predict_proba(X)[0, 1])

            # Build ranked contributions
            ranked = []
            for col, val, sv in zip(FEATURE_COLUMNS, feature_vals, faulty_shap):
                sv_f = float(sv)
                direction = "increases_fault_risk" if sv_f > 0 else "decreases_fault_risk"
                sign_str = "+" if sv_f >= 0 else ""
                plain_desc = (
                    f"{col} ({val:.2f}) {sign_str}{sv_f:.3f} toward fault probability."
                    if abs(sv_f) > 0.01 else f"{col} has negligible influence."
                )
                ranked.append({
                    "feature": col,
                    "value": round(val, 3),
                    "shap_value": round(sv_f, 4),
                    "abs_shap": abs(sv_f),
                    "direction": direction,
                    "description": plain_desc
                })

            ranked.sort(key=lambda x: x["abs_shap"], reverse=True)

            # Build waterfall data
            running_val = base_val
            waterfall = [{"step": "Base Value (Prior)", "value": round(base_val, 3), "contribution": 0.0}]
            for item in ranked[:8]:
                running_val += item["shap_value"]
                waterfall.append({
                    "step": item["feature"],
                    "value": round(running_val, 3),
                    "contribution": item["shap_value"]
                })
            waterfall.append({"step": "Final Prediction", "value": round(pred_prob, 3), "contribution": 0.0})

            return {
                "model_id": "model_1_random_forest",
                "model_name": "Random Forest Health Classifier",
                "is_shap_supported": True,
                "target_class": "Faulty (Class 1)",
                "base_value": round(base_val, 4),
                "predicted_probability": round(pred_prob, 4),
                "prediction_value": round(pred_prob, 4),
                "output_scale": "Probability",
                "explainer_type": "TreeExplainer (Exact Interventional)",
                "feature_contributions": [
                    {
                        "feature": item["feature"],
                        "value": item["value"],
                        "shap_value": item["shap_value"],
                        "contribution_direction": item["direction"],
                        "description": item["description"]
                    } for item in ranked
                ],
                "ranked_contributions": ranked,
                "waterfall_data": waterfall,
                "summary": f"Random Forest fault probability is {pred_prob*100:.1f}%. Top driver is '{ranked[0]['feature']}' with a contribution of {ranked[0]['shap_value']:+.3f}.",
                "plain_english_summary": f"Random Forest fault probability is {pred_prob*100:.1f}%. Top driver is '{ranked[0]['feature']}' with a contribution of {ranked[0]['shap_value']:+.3f}.",
                "notes": "Exact Shapley values computed via TreeExplainer."
            }

        # 2. XGBoost Multiclass Classifier
        elif model_id in ["model_2_xgboost_fault", "xgboost_fault"]:
            explainer = self._get_xgb_explainer()
            if explainer is None:
                return {"is_shap_supported": False, "error": "XGBoost model not loaded or trained."}

            shap_vals = explainer.shap_values(X)
            # Predict class
            probs = self._xgb_model.predict_proba(X)[0]
            pred_class_idx = int(np.argmax(probs))
            
            # Select target class
            if target_class and target_class in FAULT_CLASSES:
                target_idx = FAULT_CLASSES.index(target_class)
            else:
                target_idx = pred_class_idx

            target_class_name = FAULT_CLASSES[target_idx]

            # Extract class-specific SHAP values
            if isinstance(shap_vals, list):
                class_shap = shap_vals[target_idx][0]
                base_val = float(explainer.expected_value[target_idx]) if hasattr(explainer.expected_value, "__len__") else float(explainer.expected_value)
            elif len(np.shape(shap_vals)) == 3:
                class_shap = shap_vals[0, :, target_idx]
                base_val = float(explainer.expected_value[target_idx]) if hasattr(explainer.expected_value, "__len__") else float(explainer.expected_value)
            else:
                class_shap = shap_vals[0]
                base_val = float(explainer.expected_value)

            ranked = []
            for col, val, sv in zip(FEATURE_COLUMNS, feature_vals, class_shap):
                sv_f = float(sv)
                direction = "supports_class" if sv_f > 0 else "opposes_class"
                ranked.append({
                    "feature": col,
                    "value": round(val, 3),
                    "shap_value": round(sv_f, 4),
                    "abs_shap": abs(sv_f),
                    "direction": direction,
                    "description": f"{col} ({val:.2f}) {sv_f:+.3f} margin contribution for class '{target_class_name}'."
                })

            ranked.sort(key=lambda x: x["abs_shap"], reverse=True)

            running_val = base_val
            waterfall = [{"step": "Base Margin", "value": round(base_val, 3), "contribution": 0.0}]
            for item in ranked[:8]:
                running_val += item["shap_value"]
                waterfall.append({
                    "step": item["feature"],
                    "value": round(running_val, 3),
                    "contribution": item["shap_value"]
                })
            waterfall.append({"step": f"Margin ({target_class_name})", "value": round(running_val, 3), "contribution": 0.0})

            target_prob = float(probs[target_idx])
            return {
                "model_id": "model_2_xgboost_fault",
                "model_name": "XGBoost Multiclass Fault Classifier",
                "is_shap_supported": True,
                "target_class": target_class_name,
                "target_class_probability": round(target_prob, 4),
                "predicted_probability": round(target_prob, 4),
                "prediction_value": round(target_prob, 4),
                "output_scale": "Log-odds / Margin",
                "explainer_type": "TreeExplainer (Exact Interventional)",
                "base_value": round(base_val, 4),
                "feature_contributions": [
                    {
                        "feature": item["feature"],
                        "value": item["value"],
                        "shap_value": item["shap_value"],
                        "contribution_direction": item["direction"],
                        "description": item["description"]
                    } for item in ranked
                ],
                "ranked_contributions": ranked,
                "waterfall_data": waterfall,
                "all_class_probabilities": {cls: round(float(p), 4) for cls, p in zip(FAULT_CLASSES, probs)},
                "summary": f"XGBoost predicted '{target_class_name}' ({probs[target_idx]*100:.1f}% confidence). Primary supporting feature: '{ranked[0]['feature']}' ({ranked[0]['shap_value']:+.3f}).",
                "plain_english_summary": f"XGBoost predicted '{target_class_name}' ({probs[target_idx]*100:.1f}% confidence). Primary supporting feature: '{ranked[0]['feature']}' ({ranked[0]['shap_value']:+.3f}).",
                "notes": "Multiclass margin attributions computed via TreeExplainer."
            }

        # 3. 1D-CNN Autoencoder (Honest explainability: Temporal Reconstruction Residuals)
        elif model_id in ["model_3_cnn_autoencoder", "cnn_autoencoder"]:
            return {
                "model_id": "model_3_cnn_autoencoder",
                "model_name": "1D-CNN Sequence Autoencoder",
                "is_shap_supported": False,
                "explanation_method": "Temporal Reconstruction Residuals (MSE)",
                "reason": "Deep sequence autoencoders are unsupervised reconstruction models. SHAP TreeExplainer does not apply. Instead, segment-wise reconstruction error identifies anomalous time-steps directly.",
                "reconstruction_threshold": 0.0175,
                "interpretation": "Reconstruction errors above 0.0175 flag temporal anomaly divergence."
            }

        # 4. Isolation Forest (Honest explainability: Feature Space Path Length & Outlier Scoring)
        elif model_id in ["model_4_isolation_forest", "isolation_forest"]:
            return {
                "model_id": "model_4_isolation_forest",
                "model_name": "Isolation Forest Outlier Detector",
                "is_shap_supported": False,
                "explanation_method": "Average Isolation Tree Depth & Anomaly Score",
                "reason": "Unsupervised isolation trees compute anomaly scores from ensemble tree path depths rather than additive class logits.",
                "interpretation": "Observations with normalized anomaly scores > 0.60 represent low-density feature space regions."
            }

        # 5. EWMA & CUSUM (Honest explainability: Statistical Process Control Chart Limits)
        elif model_id in ["model_5_ewma_cusum", "statistical_change"]:
            return {
                "model_id": "model_5_ewma_cusum",
                "model_name": "EWMA & CUSUM Statistical Change Detectors",
                "is_shap_supported": False,
                "explanation_method": "Statistical Process Control (SPC) Limits",
                "reason": "EWMA and CUSUM are deterministic statistical algorithms, not machine-learning classifiers. SHAP values are not mathematically defined for cumulative sum recurrence relations.",
                "interpretation": "Alerts trigger when CUSUM cumulative deviation S+ or S- exceeds control limit h=5.0."
            }

        # 6. KNN (Instance-Based Distance Ranking)
        elif model_id in ["model_6_knn_classifier", "knn_classifier"]:
            return {
                "model_id": "model_6_knn_classifier",
                "model_name": "K-Nearest Neighbors Classifier",
                "is_shap_supported": False,
                "explanation_method": "Euclidean Exemplar Distance in Scaled Space",
                "reason": "KNN is a non-parametric instance-based model ($k=7$). Explanations are naturally provided by the nearest historical training exemplars and their distance weights.",
                "interpretation": "Class assignment is determined by majority vote of the 7 nearest reference windows."
            }

        # 7. Calibrated Evidence Fusion
        else:
            return {
                "model_id": "model_7_calibrated_fusion",
                "model_name": "Calibrated Evidence-Fusion Meta-Classifier",
                "is_shap_supported": False,
                "explanation_method": "Multi-Evidence Logistic Weighting & Platt Calibration",
                "reason": "Meta-classifier combines probabilities from base diagnostic models using Brier-calibrated logistic regression.",
                "interpretation": "Synthesizes supervised probability, autoencoder ratio, and drift alarms."
            }

shap_service = ShapService()
