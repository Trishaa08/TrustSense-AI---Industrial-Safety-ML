import numpy as np
import pandas as pd
import time
import logging
from app.feature_pipeline import feature_pipeline
from app.data_loader import data_loader
from app.models.random_forest import RandomForestSensorModel
from app.models.xgboost_fault import XGBoostFaultClassifier
from app.models.cnn_autoencoder import CNNAutoencoderSensorModel
from app.models.isolation_forest import IsolationForestSensorModel
from app.models.statistical_change import statistical_detector
from app.models.knn_classifier import KNNExemplarClassifier
from app.models.calibrated_fusion import CalibratedEvidenceFusionClassifier
from app.models.model_registry import model_registry

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("trustsense.train_pipeline")

def run_full_training():
    """Executes the complete leak-free multi-model training and evaluation workflow."""
    start_time = time.time()
    logger.info("=== STARTING TRUSTSENSE-GAS MODEL TRAINING PIPELINE ===")

    # 1. Load and split data
    df_train, df_val, df_test, X_train, X_val, X_test, y_train_faulty, y_val_faulty, y_test_faulty = (
        feature_pipeline.get_dataset_splits()
    )

    y_train_type = df_train["fault_type"].values
    y_test_type = df_test["fault_type"].values

    logger.info(f"Splits loaded: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

    # 2. Model 1: Random Forest
    rf_model = RandomForestSensorModel()
    rf_metrics = rf_model.train(X_train, y_train_faulty, X_test, y_test_faulty)
    model_registry.register_model("model_1_random_forest", {
        "model_id": "model_1_random_forest",
        "name": "Random Forest Sensor Health Classifier",
        "model_type": "Supervised Binary Classifier",
        "description": "Predicts healthy vs suspected faulty sensor windows with balanced class weighting.",
        "version": "1.0.0",
        "status": "trained",
        "input_features": feature_pipeline.engineer_features(df_train.head(1)).columns.tolist(),
        "output_schema": "P(faulty | features), binary prediction {0, 1}",
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "metrics": rf_metrics,
        "known_limitations": "Trained on synthetic window statistics; does not guarantee real-world transfer without site calibration."
    })

    # 3. Model 2: XGBoost Fault Classifier
    xgb_model = XGBoostFaultClassifier()
    xgb_metrics = xgb_model.train(X_train, y_train_type, X_test, y_test_type)
    model_registry.register_model("model_2_xgboost_fault", {
        "model_id": "model_2_xgboost_fault",
        "name": "XGBoost Multiclass Fault-Type Classifier",
        "model_type": f"Supervised Multiclass ({xgb_model.model_backend_name})",
        "description": "Classifies specific degradation modes: drift, offset, stuck, noise, slow response, sensitivity loss.",
        "version": "1.0.0",
        "status": "trained",
        "input_features": feature_pipeline.engineer_features(df_train.head(1)).columns.tolist(),
        "output_schema": "Class probabilities across 7 supported fault categories + uncertain flag",
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "metrics": xgb_metrics,
        "known_limitations": "Ambiguous multi-fault interactions are classified as 'uncertain'; requires clean baseline profile."
    })

    # 4. Model 3: 1D-CNN Autoencoder
    # Train strictly on healthy samples (y_faulty == 0)
    healthy_train_mask = (y_train_faulty == 0)
    healthy_val_mask = (y_val_faulty == 0)
    X_train_healthy = X_train[healthy_train_mask]
    X_val_healthy = X_val[healthy_val_mask]

    cnn_model = CNNAutoencoderSensorModel(num_features=X_train.shape[1])
    cnn_metrics = cnn_model.train(
        X_train_healthy, X_val_healthy, X_test, y_test_faulty, epochs=12, batch_size=64
    )
    model_registry.register_model("model_3_cnn_autoencoder", {
        "model_id": "model_3_cnn_autoencoder",
        "name": "1D-CNN Sequence Autoencoder",
        "model_type": "Deep Learning Semi-Supervised Reconstruction",
        "description": "Reconstructs nominal sensor response patterns; flags anomalies when reconstruction error exceeds validation threshold.",
        "version": "1.0.0",
        "status": "trained",
        "input_features": feature_pipeline.engineer_features(df_train.head(1)).columns.tolist(),
        "output_schema": "Reconstruction MSE, validation-calibrated threshold, boolean anomaly flag",
        "train_samples": len(X_train_healthy),
        "val_samples": len(X_val_healthy),
        "test_samples": len(X_test),
        "metrics": cnn_metrics,
        "known_limitations": "Anomaly does not distinguish between a sensor fault and an unfamiliar gas or environment state."
    })

    # 5. Model 4: Isolation Forest
    iso_model = IsolationForestSensorModel()
    iso_metrics = iso_model.train(X_train, X_test, y_test_faulty)
    model_registry.register_model("model_4_isolation_forest", {
        "model_id": "model_4_isolation_forest",
        "name": "Isolation Forest Novelty Detector",
        "model_type": "Unsupervised Ensemble Anomaly Detector",
        "description": "Isolates unexpected outliers and multivariate shifts without relying on fault labels.",
        "version": "1.0.0",
        "status": "trained",
        "input_features": feature_pipeline.engineer_features(df_train.head(1)).columns.tolist(),
        "output_schema": "Normalized outlier score [0, 1] and sensitivity threshold",
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "metrics": iso_metrics,
        "known_limitations": "Severe environmental changes (e.g. rapid ventilation shutdown) may elevate anomaly scores."
    })

    # 6. Model 5: EWMA and CUSUM Statistical Change Detectors
    timeseries_df = data_loader.get_timeseries_demo()
    spc_metrics = statistical_detector.evaluate_on_timeseries(timeseries_df)
    model_registry.register_model("model_5_ewma_cusum", {
        "model_id": "model_5_ewma_cusum",
        "name": "EWMA & CUSUM Change-Point Detectors",
        "model_type": "Statistical Process Control (SPC)",
        "description": "Monitors cumulative baseline shifts and exponential moving averages to track continuous sensor degradation.",
        "version": "1.0.0",
        "status": "active",
        "input_features": ["gas_reading", "baseline_estimate"],
        "output_schema": "CUSUM C+ / C- statistics, control limits, change point timestamps",
        "train_samples": 0,
        "val_samples": 0,
        "test_samples": len(timeseries_df),
        "metrics": spc_metrics,
        "known_limitations": "Requires baseline estimation window; sudden legitimate gas spikes trigger temporary change points."
    })

    # 7. Model 6: KNN Reference-Exemplar Classifier
    knn_model = KNNExemplarClassifier()
    knn_metrics = knn_model.train(X_train, y_train_faulty, X_val, y_val_faulty, X_test, y_test_faulty)
    model_registry.register_model("model_6_knn_exemplar", {
        "model_id": "model_6_knn_exemplar",
        "name": "K-Nearest Neighbors Reference Classifier",
        "model_type": "Non-Parametric Instance-Based Learning",
        "description": "Directly compares query observation with labeled healthy and faulty sensor exemplars in normalized space.",
        "version": "1.0.0",
        "status": "trained",
        "input_features": feature_pipeline.engineer_features(df_train.head(1)).columns.tolist(),
        "output_schema": "k-nearest exemplar distances, class prediction, neighbor weights",
        "train_samples": knn_metrics["reference_pool_size"],
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "metrics": knn_metrics,
        "known_limitations": "Computational cost scales with reference pool; sensitive to irrelevant noisy features."
    })

    # 8. Model 7: Calibrated Evidence-Fusion Classifier
    # Compute meta-features on validation split (out-of-fold for base models)
    _, rf_val_probs = rf_model.predict(X_val)
    ae_val_errors = cnn_model.compute_reconstruction_errors(X_val)
    _, iso_val_scores = iso_model.predict_anomaly(X_val)

    fusion_model = CalibratedEvidenceFusionClassifier()
    X_val_meta = fusion_model.construct_meta_features(
        rf_val_probs, ae_val_errors, cnn_model.threshold, iso_val_scores, X_val
    )

    # Compute meta-features on test split
    _, rf_test_probs = rf_model.predict(X_test)
    ae_test_errors = cnn_model.compute_reconstruction_errors(X_test)
    _, iso_test_scores = iso_model.predict_anomaly(X_test)
    X_test_meta = fusion_model.construct_meta_features(
        rf_test_probs, ae_test_errors, cnn_model.threshold, iso_test_scores, X_test
    )

    fusion_metrics = fusion_model.train_fusion(X_val_meta, y_val_faulty, X_test_meta, y_test_faulty)
    model_registry.register_model("model_7_calibrated_fusion", {
        "model_id": "model_7_calibrated_fusion",
        "name": "Calibrated Evidence-Fusion Meta-Classifier",
        "model_type": "Platt-Calibrated Meta-Classifier",
        "description": "Combines supervised probability, autoencoder ratio, isolation forest score, and physical deviations into calibrated reliability estimates.",
        "version": "1.0.0",
        "status": "trained",
        "input_features": ["rf_fault_prob", "ae_error_ratio", "iso_score", "ref_pulse_dev", "ref_response_dev"],
        "output_schema": "Calibrated fault probability, meta-weights, uncertainty flag",
        "train_samples": len(X_val_meta),
        "val_samples": len(X_val_meta),
        "test_samples": len(X_test_meta),
        "metrics": fusion_metrics,
        "known_limitations": "Does not override raw physical safety alarms; returns uncertain if base models conflict."
    })

    elapsed = time.time() - start_time
    logger.info(f"=== ALL 7 MODELS TRAINED AND REGISTERED IN {elapsed:.1f}s ===")
    return {
        "status": "success",
        "elapsed_seconds": elapsed,
        "registered_models": list(model_registry._models_meta.keys())
    }

if __name__ == "__main__":
    run_full_training()
