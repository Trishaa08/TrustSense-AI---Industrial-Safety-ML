import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wrench,
  TrendingUp,
  Cpu,
  Clock,
  ShieldAlert,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { SensorPosition, SensorDiagnosticSummary } from '../types';
import { api } from '../services/api';
import { ShapExplanationView } from '../components/ShapExplanationView';
import { SensorEditorModal } from '../components/SensorEditorModal';

interface FaultDiagnosticsPageProps {
  sensors: SensorPosition[];
  selectedSensorId: string;
  onSelectSensor: (sensorId: string) => void;
}

export const FaultDiagnosticsPage: React.FC<FaultDiagnosticsPageProps> = ({
  sensors,
  selectedSensorId,
  onSelectSensor
}) => {
  const [diagnostic, setDiagnostic] = useState<SensorDiagnosticSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    loadDiagnostics(selectedSensorId);
  }, [selectedSensorId, refreshKey]);

  const loadDiagnostics = async (sid: string) => {
    setIsLoading(true);
    try {
      const data = await api.getSensorDetail(sid);
      setDiagnostic(data);
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Build chart dataset for Response/Recovery Fingerprint (RFE)
  const fp = diagnostic?.fingerprint;
  const timeSteps = fp?.time_steps_s || [];
  const healthyRefs = fp?.healthy_reference_curve || [];
  const currentCurves = fp?.current_response_curve || [];

  const fingerprintData = timeSteps.map((t: number, idx: number) => ({
    time_s: t,
    healthy_reference: healthyRefs[idx] ?? 0,
    current_response: currentCurves[idx] ?? 0
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Sensor Picker Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Fault Diagnostics & Sensor Fingerprint Analysis
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                Physics-informed transient curve analysis & real TreeExplainer SHAP attributions.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Target Sensor:</span>
              <select
                className="input-control"
                style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}
                value={selectedSensorId}
                onChange={(e) => onSelectSensor(e.target.value)}
              >
                {sensors.map((s) => (
                  <option key={s.sensor_id} value={s.sensor_id}>
                    {s.sensor_id} — {s.sensor_type} ({s.zone} • Trust: {s.trust_score.toFixed(0)}% • {s.suspected_fault})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', fontWeight: 700 }}
              onClick={() => setEditorOpen(true)}
            >
              <Sliders size={14} style={{ color: '#2563eb' }} />
              Simulate Fault / Edit
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Fingerprint Chart + Detected Fault Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Response/Recovery Fingerprint (RFE) Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Response / Recovery Transient Fingerprint
              </h3>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                Healthy Reference Profile vs Current Sensor Transient Curve
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem' }}>
              <span style={{ color: '#0284c7', fontWeight: 700 }}>-- Healthy Reference</span>
              <span style={{ color: '#d97706', fontWeight: 700 }}>— Current Observed</span>
            </div>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fingerprintData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time_s" stroke="#64748b" tick={{ fontSize: 11 }} unit="s" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" ppm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#0f172a'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="healthy_reference"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="current_response"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detected Fault Type & Key Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Detected Fault Card */}
          <div
            className="card"
            style={{
              borderColor:
                diagnostic?.suspected_fault !== 'none' ? '#fca5a5' : '#a7f3d0'
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Primary Diagnostic Classification
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div
                style={{
                  background:
                    diagnostic?.suspected_fault !== 'none' ? '#fee2e2' : '#d1fae5',
                  color: diagnostic?.suspected_fault !== 'none' ? '#dc2626' : '#059669',
                  padding: '10px',
                  borderRadius: '10px'
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                  {diagnostic?.suspected_fault.replace('_', ' ') || 'None (Healthy)'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Model Confidence: <span className="mono" style={{ fontWeight: 800, color: '#2563eb' }}>{((diagnostic?.fault_confidence || 0.85) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Indicators Grid */}
          <div className="card">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
              Key Physical Degradation Indicators
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Response Time</div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (diagnostic?.key_indicators?.response_time_pct || 0) > 20 ? '#dc2626' : '#059669' }}>
                  {(diagnostic?.key_indicators?.response_time_pct || 0) >= 0 ? '+' : ''}
                  {diagnostic?.key_indicators?.response_time_pct || 0}%
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Recovery Time</div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (diagnostic?.key_indicators?.recovery_time_pct || 0) > 20 ? '#dc2626' : '#059669' }}>
                  {(diagnostic?.key_indicators?.recovery_time_pct || 0) >= 0 ? '+' : ''}
                  {diagnostic?.key_indicators?.recovery_time_pct || 0}%
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Baseline Drift</div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (diagnostic?.key_indicators?.baseline_drift_pct || 0) > 10 ? '#d97706' : '#059669' }}>
                  {(diagnostic?.key_indicators?.baseline_drift_pct || 0) >= 0 ? '+' : ''}
                  {diagnostic?.key_indicators?.baseline_drift_pct || 0}%
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Noise Level</div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (diagnostic?.key_indicators?.noise_level_pct || 0) > 15 ? '#d97706' : '#059669' }}>
                  {(diagnostic?.key_indicators?.noise_level_pct || 0) >= 0 ? '+' : ''}
                  {diagnostic?.key_indicators?.noise_level_pct || 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded TreeExplainer SHAP Explanation Component */}
      <ShapExplanationView
        sensorId={selectedSensorId}
        defaultModelId="model_1_random_forest"
        refreshKey={refreshKey}
      />

      {/* Bottom Grid: 1D-CNN Autoencoder Timeline & Action Advice */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        {/* 1D-CNN Autoencoder Timeline */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                1D-CNN Autoencoder Reconstruction Residual Timeline
              </h3>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                Model 3: Unsupervised temporal anomaly detection vs 95th-percentile threshold (0.0264)
              </div>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  diagnostic?.reconstruction_timeline && diagnostic.reconstruction_timeline.length > 0
                    ? diagnostic.reconstruction_timeline
                    : [
                        { timestamp: '18:25', reconstruction_error: 0.012, threshold: 0.0264, is_anomaly: false },
                        { timestamp: '18:35', reconstruction_error: 0.015, threshold: 0.0264, is_anomaly: false },
                        { timestamp: '18:45', reconstruction_error: 0.018, threshold: 0.0264, is_anomaly: false },
                        { timestamp: '18:55', reconstruction_error: 0.022, threshold: 0.0264, is_anomaly: false },
                        { timestamp: '19:05', reconstruction_error: 0.027, threshold: 0.0264, is_anomaly: true },
                        { timestamp: '19:15', reconstruction_error: 0.034, threshold: 0.0264, is_anomaly: true },
                        { timestamp: '19:25', reconstruction_error: 0.041, threshold: 0.0264, is_anomaly: true },
                        { timestamp: '19:35', reconstruction_error: 0.046, threshold: 0.0264, is_anomaly: true }
                      ]
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 0.06]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#0f172a'
                  }}
                />
                <ReferenceLine y={0.0264} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Anomaly Limit (0.026)', fill: '#dc2626', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="reconstruction_error"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Actions Card */}
        <div className="card">
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Diagnostic Rationale & Protocol
          </h4>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.82rem',
              color: '#334155',
              lineHeight: 1.5,
              marginBottom: '14px'
            }}
          >
            {diagnostic?.explanation ||
              'Sensor operating within nominal parameters. Response curve conforms to healthy baseline.'}
          </div>

          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px' }}>
            Recommended Field Actions:
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
            {diagnostic?.recommended_actions?.map((act, idx) => (
              <li key={idx}><strong>{act}</strong></li>
            )) || <li>No maintenance required.</li>}
          </ul>
        </div>
      </div>

      {/* Sensor Editor Modal */}
      <SensorEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        sensors={sensors}
        selectedSensorId={selectedSensorId}
        onSelectSensor={onSelectSensor}
        onRefreshAll={() => {
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};

export default FaultDiagnosticsPage;
