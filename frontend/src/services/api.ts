import {
  SensorPosition,
  SystemStatus,
  SensorDiagnosticSummary,
  LocalizationResult,
  AlertItem,
  ModelMetadata,
  DatasetInfo,
  DatasetPreview,
  SimulationInfo,
  SimulationStepData,
  ModifySensorRequest,
  ModifySensorResponse,
  ShapExplanation
} from '../types';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, options);
  if (!res.ok) {
    let errMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      else if (errData.message) errMsg = errData.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // System
  async getHealth() {
    return fetchJson<{
      status: string;
      timestamp: string;
      version: string;
      models_ready: boolean;
      safety_disclaimer: string;
    }>('/health');
  },

  async getSystemStatus(): Promise<SystemStatus> {
    return fetchJson<SystemStatus>('/system/status');
  },

  async getSettings() {
    return fetchJson<{ settings: Record<string, any>; trust_weights: Record<string, number> }>('/system/settings');
  },

  async updateSettings(payload: { settings?: Record<string, any>; trust_weights?: Record<string, number> }) {
    return fetchJson<{ message: string; settings: Record<string, any>; trust_weights: Record<string, number> }>(
      '/system/settings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
  },

  async resetSettings() {
    return fetchJson<{ message: string; settings: Record<string, any> }>('/system/settings/reset', {
      method: 'POST'
    });
  },

  // Sensors
  async getSensors(): Promise<{ sensors: SensorPosition[]; total_count: number }> {
    return fetchJson<{ sensors: SensorPosition[]; total_count: number }>('/sensors');
  },

  async getSensorDetail(sensorId: string): Promise<SensorDiagnosticSummary> {
    return fetchJson<SensorDiagnosticSummary>(`/sensors/${sensorId}`);
  },

  async getSensorFingerprint(sensorId: string) {
    return fetchJson<{
      time_steps_s: number[];
      healthy_reference_curve: number[];
      current_response_curve: number[];
      description: string;
    }>(`/sensors/${sensorId}/fingerprint`);
  },

  async getSensorHistory(sensorId: string, limit = 60): Promise<{ sensor_id: string; history: any[] }> {
    return fetchJson<{ sensor_id: string; history: any[] }>(`/sensors/${sensorId}/history?limit=${limit}`);
  },

  async modifySensor(sensorId: string, payload: ModifySensorRequest): Promise<ModifySensorResponse> {
    return fetchJson<ModifySensorResponse>(`/sensors/${sensorId}/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async resetDemoSensors(): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>('/sensors/reset-demo', {
      method: 'POST'
    });
  },

  async getSensorShap(
    sensorId: string,
    modelId = 'model_1_random_forest',
    targetClass?: string
  ): Promise<ShapExplanation> {
    const params = new URLSearchParams({ model_id: modelId });
    if (targetClass) params.set('target_class', targetClass);
    return fetchJson<ShapExplanation>(`/sensors/${sensorId}/shap?${params.toString()}`);
  },

  // Localization
  async estimateLocalization(params: {
    method: 'baseline' | 'fault_aware' | 'filtered';
    leak_id?: string;
    readings?: Array<{ sensor_id: string; gas_reading: number; trust_score: number }>;
    min_reliable_sensors?: number;
    trust_threshold?: number;
  }): Promise<LocalizationResult> {
    return fetchJson<LocalizationResult>('/localization/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  async getLocalizationExperiments(): Promise<any> {
    return fetchJson<any>('/localization/experiments');
  },

  async getGroundTruthEvents(): Promise<{ ground_truth_events: any[] }> {
    return fetchJson<{ ground_truth_events: any[] }>('/localization/ground-truth');
  },

  // Simulation Playback
  async getSimulationInfo(): Promise<SimulationInfo> {
    return fetchJson<SimulationInfo>('/simulation/info');
  },

  async getSimulationStep(stepIndex: number): Promise<SimulationStepData> {
    return fetchJson<SimulationStepData>(`/simulation/step/${stepIndex}`);
  },

  // Models
  async getModels(): Promise<{ models: ModelMetadata[]; total_registered: number }> {
    return fetchJson<{ models: ModelMetadata[]; total_registered: number }>('/models');
  },

  async getModelMetrics(modelId: string): Promise<ModelMetadata> {
    return fetchJson<ModelMetadata>(`/models/${modelId}/metrics`);
  },

  async triggerTraining(): Promise<{ status: string; message: string; details: any }> {
    return fetchJson<{ status: string; message: string; details: any }>('/models/train', {
      method: 'POST'
    });
  },

  // Alerts
  async getAlerts(filters?: { severity?: string; sensor_id?: string; status?: string }): Promise<{ alerts: AlertItem[]; total_count: number }> {
    const params = new URLSearchParams();
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.sensor_id) params.set('sensor_id', filters.sensor_id);
    if (filters?.status) params.set('status', filters.status);
    return fetchJson<{ alerts: AlertItem[]; total_count: number }>(`/alerts?${params.toString()}`);
  },

  async acknowledgeAlert(alertId: string, payload: { status: string; analyst_name: string; notes?: string }) {
    return fetchJson<{ success: boolean; alert: AlertItem }>(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // Reports
  async getInvestigationReport(leakId: string): Promise<any> {
    return fetchJson<any>(`/reports/investigation/${leakId}`);
  },

  // Datasets
  async getDatasets(): Promise<{ datasets: DatasetInfo[] }> {
    return fetchJson<{ datasets: DatasetInfo[] }>('/datasets');
  },

  async getDatasetPreview(filename: string, limit = 50, isUploaded = false): Promise<DatasetPreview> {
    return fetchJson<DatasetPreview>(`/datasets/preview?filename=${encodeURIComponent(filename)}&limit=${limit}&is_uploaded=${isUploaded}`);
  },

  async uploadDataset(file: File): Promise<{ success: boolean; filename: string; rows_parsed: number; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/datasets/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async resetToDemo(): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/system/settings/reset', {
      method: 'POST'
    });
  }
};
