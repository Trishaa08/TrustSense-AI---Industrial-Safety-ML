from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from app.schemas import SensorReadingInput
from app.feature_pipeline import feature_pipeline, FEATURE_COLUMNS
from app.models.random_forest import RandomForestSensorModel
from app.models.xgboost_fault import XGBoostFaultClassifier
from app.models.cnn_autoencoder import CNNAutoencoderSensorModel
from app.models.isolation_forest import IsolationForestSensorModel
from app.services.trust_score import trust_engine

router = APIRouter(prefix="/predict", tags=["Prediction & Diagnostics"])

# Lazy-loaded model instances
rf_model = RandomForestSensorModel()
xgb_model = XGBoostFaultClassifier()
cnn_model = CNNAutoencoderSensorModel()
iso_model = IsolationForestSensorModel()

def _prepare_single_feature_vector(reading: SensorReadingInput) -> np.ndarray:
    raw_dict = {
        "sensor_id": reading.sensor_id,
        "gas_reading": reading.gas_reading,
        "temperature_c": reading.temperature_c,
        "humidity_pct": reading.humidity_pct,
        "airflow_m_s": reading.airflow_m_s,
        "baseline_estimate": reading.baseline_estimate if reading.baseline_estimate is not None else 12.0,
        "response_time_s": reading.response_time_s if reading.response_time_s is not None else 18.0,
        "recovery_time_s": reading.recovery_time_s if reading.recovery_time_s is not None else 32.0,
        "rolling_noise_std": reading.rolling_noise_std if reading.rolling_noise_std is not None else 1.0,
        "pulse_amplitude": reading.pulse_amplitude if reading.pulse_amplitude is not None else 1.0,
        "pulse_curve_distance": reading.pulse_curve_distance if reading.pulse_curve_distance is not None else 0.12,
        "hour": 12
    }
    df = pd.DataFrame([raw_dict])
    X = feature_pipeline.transform(df)
    return X

@router.post("/sensor-health")
def predict_sensor_health(reading: SensorReadingInput):
    """Predicts healthy vs faulty sensor window using Random Forest Model 1."""
    if not rf_model.is_trained:
        raise HTTPException(status_code=503, detail="Random Forest model has not been trained yet. Run /models/train first.")
    
    X = _prepare_single_feature_vector(reading)
    pred, prob = rf_model.predict(X)
    is_faulty = int(pred[0])
    fault_prob = float(prob[0])

    return {
        "sensor_id": reading.sensor_id,
        "is_faulty_pred": is_faulty,
        "fault_probability": round(fault_prob, 3),
        "health_status": "suspected_faulty" if is_faulty == 1 else "healthy",
        "confidence": round(fault_prob if is_faulty == 1 else (1.0 - fault_prob), 3),
        "model_version": "1.0.0",
        "top_features": list(rf_model.metrics.get("feature_importance", {}).keys())[:4]
    }

@router.post("/fault-type")
def predict_fault_type(reading: SensorReadingInput):
    """Predicts specific degradation mode using XGBoost Model 2."""
    if not xgb_model.is_trained:
        raise HTTPException(status_code=503, detail="XGBoost Fault model has not been trained yet.")
    
    X = _prepare_single_feature_vector(reading)
    labels, probs, uncertain = xgb_model.predict(X, uncertainty_threshold=0.35)
    
    pred_label = labels[0]
    prob_dict = {
        cls_name: round(float(p), 3) 
        for cls_name, p in zip(xgb_model.class_names, probs[0])
    }

    return {
        "sensor_id": reading.sensor_id,
        "predicted_fault_type": pred_label,
        "confidence": round(float(np.max(probs[0])), 3),
        "is_uncertain": bool(uncertain[0]),
        "probabilities": prob_dict,
        "model_name": xgb_model.model_backend_name
    }

@router.post("/anomaly")
def predict_anomaly(reading: SensorReadingInput):
    """Runs 1D-CNN Autoencoder and Isolation Forest to detect novel signal anomalies."""
    X = _prepare_single_feature_vector(reading)
    
    ae_error = float(cnn_model.compute_reconstruction_errors(X)[0]) if cnn_model.is_trained else 0.25
    ae_threshold = float(cnn_model.threshold) if cnn_model.is_trained else 0.50
    is_ae_anom = ae_error > ae_threshold

    iso_anom, iso_score = iso_model.predict_anomaly(X) if iso_model.is_trained else (np.array([False]), np.array([0.2]))
    
    return {
        "sensor_id": reading.sensor_id,
        "autoencoder_mse": round(ae_error, 4),
        "autoencoder_threshold": round(ae_threshold, 4),
        "is_autoencoder_anomaly": bool(is_ae_anom),
        "isolation_forest_score": round(float(iso_score[0]), 3),
        "is_isolation_forest_anomaly": bool(iso_anom[0]),
        "combined_novelty_detected": bool(is_ae_anom or iso_anom[0])
    }

@router.post("/trust-score")
def calculate_trust(reading: SensorReadingInput):
    """Calculates comprehensive 0-100 sensor trust score."""
    X = _prepare_single_feature_vector(reading)
    _, prob = rf_model.predict(X) if rf_model.is_trained else (None, [0.1])
    ae_error = float(cnn_model.compute_reconstruction_errors(X)[0]) if cnn_model.is_trained else 0.2

    score_dict = trust_engine.calculate_trust_score(
        sensor_id=reading.sensor_id,
        fault_probability=float(prob[0]),
        ae_error=ae_error,
        ae_threshold=cnn_model.threshold if cnn_model.is_trained else 0.5,
        noise_std=reading.rolling_noise_std if reading.rolling_noise_std is not None else 1.0,
        diff_response_time=(reading.response_time_s - 18.0) if reading.response_time_s else 0.0
    )
    return score_dict
