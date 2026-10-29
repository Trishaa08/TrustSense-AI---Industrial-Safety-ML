from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Common & System Schemas ---
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    environment: str
    version: str
    data_dir_exists: bool
    models_ready: bool
    safety_disclaimer: str

class SystemStatusResponse(BaseModel):
    overall_status: str  # "operational", "warning", "critical", "uncertain"
    gas_event_status: str  # "no_event", "suspected_event", "uncertain"
    total_sensors: int
    healthy_sensors: int
    suspected_faulty_sensors: int
    unavailable_sensors: int
    average_trust_score: float
    highest_gas_reading: float
    highest_gas_sensor_id: str
    active_alerts_count: int
    simulation_mode: bool
    data_provenance: str
    last_update: str
    selected_site: str

# --- Dataset Schemas ---
class DatasetFileInfo(BaseModel):
    filename: str
    rows: int
    columns: List[str]
    size_bytes: int
    description: str
    data_origin: str

class DatasetPreviewResponse(BaseModel):
    filename: str
    total_rows: int
    columns: List[str]
    dtypes: Dict[str, str]
    missing_values: Dict[str, int]
    head: List[Dict[str, Any]]
    label_distribution: Optional[Dict[str, Any]] = None
    provenance: str

class UploadResponse(BaseModel):
    success: bool
    filename: str
    rows_parsed: int
    detected_columns: List[str]
    message: str

# --- Sensor Schemas ---
class SensorPosition(BaseModel):
    sensor_id: str
    sensor_type: str
    x_m: float
    y_m: float
    zone: str
    floor: int
    batch_id: str
    calibration_age_days: int

class SensorSummary(BaseModel):
    sensor_id: str
    sensor_type: str
    x_m: float
    y_m: float
    zone: str
    current_reading: float
    unit: str
    health_status: str  # "healthy", "suspected_faulty", "warning", "offline"
    trust_score: float  # 0 to 100
    suspected_fault: str  # "none", "drift", "offset", "stuck", "noise_increase", "slow_response", "sensitivity_loss", "unknown"
    anomaly_score: float
    last_timestamp: str
    recommended_action: str

# --- Prediction & Diagnostics Schemas ---
class SensorReadingInput(BaseModel):
    sensor_id: str
    gas_reading: float
    temperature_c: float
    humidity_pct: float
    airflow_m_s: float
    baseline_estimate: Optional[float] = None
    response_time_s: Optional[float] = None
    recovery_time_s: Optional[float] = None
    rolling_noise_std: Optional[float] = None
    pulse_amplitude: Optional[float] = None
    pulse_curve_distance: Optional[float] = None

class SensorHealthPrediction(BaseModel):
    sensor_id: str
    is_faulty_pred: int
    fault_probability: float
    health_status: str
    confidence: float
    model_version: str
    feature_contributions: Dict[str, float]

class FaultTypePrediction(BaseModel):
    sensor_id: str
    predicted_fault_type: str
    fault_probabilities: Dict[str, float]
    confidence: float
    model_name: str
    is_uncertain: bool
    diagnostic_rationale: str

class AnomalyPrediction(BaseModel):
    sensor_id: str
    autoencoder_recon_error: float
    autoencoder_threshold: float
    is_autoencoder_anomaly: bool
    isolation_forest_score: float
    is_iso_anomaly: bool
    combined_anomaly_flag: bool
    explanation: str

class SensorTrustBreakdown(BaseModel):
    sensor_id: str
    trust_score: float  # 0 to 100
    health_label: str
    rf_fault_penalty: float
    autoencoder_penalty: float
    drift_cusum_penalty: float
    noise_penalty: float
    stuck_penalty: float
    reference_deviation_penalty: float
    contributing_reasons: List[str]
    inspection_advice: str

# --- Localization Schemas ---
class SensorReadingForLocalization(BaseModel):
    sensor_id: str
    gas_reading: float
    trust_score: Optional[float] = 100.0

class LocalizationRequest(BaseModel):
    readings: Optional[List[SensorReadingForLocalization]] = None
    leak_id: Optional[str] = None  # If evaluating a predefined sample
    method: str = "fault_aware"  # "baseline", "fault_aware", "filtered"
    min_reliable_sensors: int = 3
    trust_threshold: float = 60.0

class LocalizationResult(BaseModel):
    method: str
    success: bool
    estimated_x_m: Optional[float] = None
    estimated_y_m: Optional[float] = None
    estimated_zone: Optional[str] = None
    uncertainty_radius_m: Optional[float] = None
    confidence_level: str  # "high", "medium", "low", "refused"
    sensors_used_count: int
    sensors_excluded_count: int
    reliable_sensor_ids: List[str]
    unreliable_sensor_ids: List[str]
    evidence_quality: str
    comparison: Optional[Dict[str, Any]] = None  # Comparison between baseline vs fault-aware
    message: str
    disclaimer: str

# --- Alert Schemas ---
class AlertItem(BaseModel):
    alert_id: str
    timestamp: str
    sensor_id: Optional[str] = None
    zone: Optional[str] = None
    severity: str  # "critical", "warning", "info"
    alert_type: str  # "suspected_leak", "sensor_fault", "sensor_drift", "anomaly"
    title: str
    description: str
    status: str  # "new", "acknowledged", "investigating", "resolved"
    trust_score_at_alert: Optional[float] = None
    reading_at_alert: Optional[float] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None
    notes: Optional[str] = None

class AcknowledgeRequest(BaseModel):
    status: str  # "acknowledged", "investigating", "resolved"
    analyst_name: str
    notes: Optional[str] = ""

# --- Model Registry & Evaluation Schemas ---
class ModelMeta(BaseModel):
    model_id: str
    name: str
    model_type: str
    description: str
    version: str
    status: str  # "trained", "loaded", "fallback", "untrained"
    input_features: List[str]
    output_schema: str
    train_samples: int
    val_samples: int
    test_samples: int
    metrics: Dict[str, Any]
    known_limitations: str

class ModelRegistryResponse(BaseModel):
    models: List[ModelMeta]
    timestamp: str
    data_provenance: str

class ExperimentResult(BaseModel):
    experiment_id: str
    title: str
    description: str
    baseline_error_m: float
    fault_aware_error_m: float
    error_reduction_pct: float
    coverage_pct: float
    sample_size: int
    notes: str

# --- Simulation Schemas ---
class SimulationStepData(BaseModel):
    step_index: int
    timestamp: str
    unit_id: str
    sensors: List[Dict[str, Any]]
    active_gas_event: bool
    active_fault: bool
    fault_type: str
    localized_leak: Optional[LocalizationResult] = None

# --- Interactive Sensor Edit & Fault Injection Schemas ---
class ModifySensorRequest(BaseModel):
    gas_reading: float = Field(..., ge=0.0, le=500.0, description="Observed gas reading in ppm")
    temperature_c: Optional[float] = Field(None, ge=-20.0, le=60.0, description="Ambient temperature in °C")
    humidity_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Ambient relative humidity %")
    airflow_m_s: Optional[float] = Field(None, ge=0.0, le=10.0, description="Ambient airflow in m/s")
    x_m: Optional[float] = Field(None, ge=0.0, le=45.0, description="X coordinate in meters")
    y_m: Optional[float] = Field(None, ge=0.0, le=30.0, description="Y coordinate in meters")
    injected_fault: str = Field("none", description="Fault injection mode: none, drift, offset, stuck, noise_increase, slow_response, sensitivity_loss")
    fault_params: Optional[Dict[str, Any]] = None

class ModifySensorResponse(BaseModel):
    success: bool
    sensor_id: str
    gas_reading: float
    temperature_c: float
    humidity_pct: float
    airflow_m_s: float
    x_m: float
    y_m: float
    injected_fault: str
    health_status: str
    trust_score: float
    suspected_fault: str
    is_modified: bool
    message: str
    model_predictions: Dict[str, Any]
    shap_explanation: Optional[Dict[str, Any]] = None
    dependent_refresh: Dict[str, Any]
