export interface SensorPosition {
  sensor_id: string;
  sensor_type: string;
  x_m: number;
  y_m: number;
  zone: string;
  floor: number;
  batch_id?: string;
  calibration_age_days?: number;
  current_reading: number;
  unit: string;
  health_status: 'healthy' | 'warning' | 'suspected_faulty';
  trust_score: number;
  suspected_fault: string;
  recommended_action: string;
  last_timestamp: string;
  is_user_modified?: boolean;
}

export interface ModifySensorRequest {
  gas_reading: number;
  temperature_c?: number;
  humidity_pct?: number;
  airflow_m_s?: number;
  x_m?: number;
  y_m?: number;
  injected_fault?: string;
  fault_params?: Record<string, any>;
}

export interface ShapFeatureContribution {
  feature: string;
  value: number;
  shap_value: number;
  contribution_direction: string;
  description: string;
}

export interface ShapExplanation {
  model_id: string;
  model_name: string;
  target_class: string;
  base_value: number;
  prediction_value: number;
  output_scale: string;
  feature_contributions: ShapFeatureContribution[];
  plain_english_summary: string;
  explainer_type: string;
  notes: string;
}

export interface ModifySensorResponse {
  success: boolean;
  sensor_id: string;
  gas_reading: number;
  temperature_c: number;
  humidity_pct: number;
  airflow_m_s: number;
  x_m: number;
  y_m: number;
  injected_fault: string;
  health_status: string;
  trust_score: number;
  suspected_fault: string;
  is_modified: boolean;
  message: string;
  model_predictions: Record<string, any>;
  shap_explanation?: ShapExplanation;
  dependent_refresh: Record<string, any>;
}

export interface SystemStatus {
  overall_status: 'operational' | 'warning' | 'critical';
  gas_event_status: 'no_event' | 'suspected_event' | 'uncertain';
  total_sensors: number;
  healthy_sensors: number;
  suspected_faulty_sensors: number;
  unavailable_sensors: number;
  average_trust_score: number;
  highest_gas_reading: number;
  highest_gas_sensor_id: string;
  active_alerts_count: number;
  simulation_mode: boolean;
  data_provenance: string;
  last_update: string;
  selected_site: string;
  safety_disclaimer: string;
}

export interface SensorDiagnosticSummary {
  sensor_id: string;
  sensor_type: string;
  zone: string;
  position: { x_m: number; y_m: number; floor: number };
  trust_score: number;
  health_status: string;
  suspected_fault: string;
  fault_confidence: number;
  trust_breakdown: Record<string, number>;
  key_indicators: {
    response_time_pct: number;
    recovery_time_pct: number;
    baseline_drift_pct: number;
    noise_level_pct: number;
    raw_reading: number;
    baseline: number;
  };
  fingerprint: {
    time_steps_s: number[];
    healthy_reference_curve: number[];
    current_response_curve: number[];
    description: string;
  };
  reconstruction_timeline: Array<{
    timestamp: string;
    reconstruction_error: number;
    threshold: number;
    is_anomaly: boolean;
  }>;
  explanation: string;
  recommended_actions: string[];
}

export interface LocalizationResult {
  method_used: string;
  status: 'success' | 'refused' | 'warning';
  estimated_x_m: number | null;
  estimated_y_m: number | null;
  estimated_zone: string | null;
  uncertainty_radius_m: number | null;
  supporting_sensors_count: number;
  excluded_faulty_sensors_count: number;
  confidence_score: number;
  evidence_quality: string;
  message: string;
  sensor_weights: Record<string, number>;
  contributing_sensors: Array<{
    sensor_id: string;
    reading: number;
    trust_score: number;
    weight: number;
    zone: string;
    status: string;
  }>;
  disclaimer: string;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  sensor_id: string;
  zone: string;
  reading: number;
  trust_score: number;
  title: string;
  description: string;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  analyst_signature?: string;
  analyst_notes?: string;
  audit_trail: Array<{
    action: string;
    timestamp: string;
    user: string;
    note?: string;
  }>;
}

export interface ModelMetadata {
  model_id: string;
  name: string;
  model_family: string;
  version: string;
  purpose: string;
  trained_date: string;
  training_samples: number;
  test_samples: number;
  input_features: string[];
  metrics: Record<string, any>;
  confusion_matrix?: {
    labels: string[];
    matrix: number[][];
  };
  feature_importance?: Array<{ feature: string; importance: number }>;
  calibration?: {
    brier_score?: number;
    prob_true?: number[];
    prob_pred?: number[];
  };
  limitations: string[];
}

export interface DatasetInfo {
  filename: string;
  row_count: number;
  column_count: number;
  size_kb: number;
  description: string;
  role: string;
}

export interface DatasetPreview {
  filename: string;
  row_count: number;
  columns: string[];
  dtypes: Record<string, string>;
  null_counts: Record<string, number>;
  rows: Record<string, any>[];
  is_uploaded: boolean;
}

export interface SimulationInfo {
  total_steps: number;
  sample_rate: string;
  duration_hours: number;
  sensors_tracked: string[];
  time_start: string;
  time_end: string;
  current_step: number;
}

export interface SimulationStepData {
  step_index: number;
  timestamp: string;
  sensor_readings: Record<string, number>;
  sensor_trust_scores: Record<string, number>;
  active_gas_event: boolean;
  fault_injections: Record<string, string>;
  localization: LocalizationResult;
}
