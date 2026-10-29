import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  Sliders,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingDown,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { SensorPosition } from '../types';
import { api } from '../services/api';

interface SensorHealthPageProps {
  sensors: SensorPosition[];
  onSelectSensor: (sensorId: string) => void;
  onNavigate: (page: string) => void;
}

export const SensorHealthPage: React.FC<SensorHealthPageProps> = ({
  sensors,
  onSelectSensor,
  onNavigate
}) => {
  const [selectedSensor, setSelectedSensor] = useState<SensorPosition | null>(sensors[0] || null);
  const [weights, setWeights] = useState<Record<string, number>>({
    w_rf_supervised: 0.30,
    w_ae_reconstruction: 0.25,
    w_iso_forest: 0.15,
    w_change_detection: 0.15,
    w_completeness_stuck: 0.15
  });
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    if (sensors.length > 0 && !selectedSensor) {
      setSelectedSensor(sensors[0]);
    }
  }, [sensors]);

  const handleWeightChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const saveWeights = async () => {
    setIsUpdating(true);
    try {
      await api.updateSettings({ trust_weights: weights });
      setSaveMessage('Trust scoring weights saved and applied across inference pipeline.');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const resetWeights = async () => {
    const defaults = {
      w_rf_supervised: 0.30,
      w_ae_reconstruction: 0.25,
      w_iso_forest: 0.15,
      w_change_detection: 0.15,
      w_completeness_stuck: 0.15
    };
    setWeights(defaults);
    await api.updateSettings({ trust_weights: defaults });
  };

  const chartData = sensors.map((s) => ({
    sensor_id: s.sensor_id,
    trust_score: s.trust_score,
    status: s.health_status
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header Info Banner */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-subtle)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
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
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Sensor Health & Trust Scoring Matrix
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              Transparent 0–100 reliability indicator integrating supervised fault probability, autoencoder reconstruction, and drift detectors.
            </div>
          </div>
        </div>

        <span className="badge badge-healthy" style={{ padding: '6px 14px', fontSize: '0.76rem' }}>
          16 Sensors Monitored
        </span>
      </div>

      {/* Network Trust Score Distribution Chart */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              All 16 Sensors — Trust Score Distribution
            </h3>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
              Green &ge; 80% (Healthy) | Amber 60–79% (Warning) | Red &lt; 60% (Unreliable / Excluded)
            </div>
          </div>
        </div>

        <div style={{ height: '210px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="sensor_id" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#0f172a'
                }}
              />
              <Bar dataKey="trust_score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => {
                  const color =
                    entry.trust_score >= 80 ? '#10b981' : entry.trust_score >= 60 ? '#f59e0b' : '#ef4444';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid: Full Matrix Table + Trust Weight Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        {/* Full Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Sensor Health & Trust Score Matrix
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
              Click row to inspect decomposition
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Zone</th>
                  <th>Reading</th>
                  <th>Health</th>
                  <th>Trust Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((s) => {
                  const isSelected = selectedSensor?.sensor_id === s.sensor_id;
                  const isHealthy = s.health_status === 'healthy';
                  const isWarning = s.health_status === 'warning';
                  return (
                    <tr
                      key={s.sensor_id}
                      onClick={() => {
                        setSelectedSensor(s);
                        onSelectSensor(s.sensor_id);
                      }}
                      style={{
                        background: isSelected ? '#eff6ff' : undefined,
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ fontWeight: 800, color: '#2563eb' }}>{s.sensor_id}</td>
                      <td style={{ fontSize: '0.78rem', color: '#334155' }}>{s.sensor_type}</td>
                      <td style={{ fontSize: '0.78rem', color: '#475569' }}>{s.zone}</td>
                      <td className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {s.current_reading.toFixed(1)} ppm
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isHealthy ? 'badge-healthy' : isWarning ? 'badge-warning' : 'badge-faulty'
                          }`}
                        >
                          {s.health_status}
                        </span>
                      </td>
                      <td className="mono" style={{ fontWeight: 800, color: s.trust_score >= 80 ? '#059669' : s.trust_score >= 60 ? '#d97706' : '#dc2626' }}>
                        {s.trust_score.toFixed(0)}%
                      </td>
                      <td>
                        <button
                          className="btn-troubleshoot"
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSensor(s.sensor_id);
                            onNavigate('fault-diagnostics');
                          }}
                        >
                          Diagnose
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Sensor Decomposition & Configurable Weights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected Sensor Detail */}
          {selectedSensor && (
            <div className="card" style={{ borderColor: '#2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                  Breakdown: {selectedSensor.sensor_id}
                </span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedSensor.trust_score >= 80 ? '#059669' : '#dc2626' }}>
                  {selectedSensor.trust_score.toFixed(0)} / 100
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, marginBottom: '12px' }}>
                Installed in {selectedSensor.zone} (Floor {selectedSensor.floor}).
                Physical type: {selectedSensor.sensor_type}. Calibration age: {selectedSensor.calibration_age_days || 20} days.
              </div>

              {/* Contributing reasons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ color: '#334155' }}>Supervised Health Probability:</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>{selectedSensor.health_status === 'healthy' ? '0.98' : '0.24'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ color: '#334155' }}>Autoencoder Residual Score:</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>{selectedSensor.health_status === 'healthy' ? '0.012' : '0.048'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ color: '#334155' }}>CUSUM Baseline Shift:</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>{selectedSensor.suspected_fault.includes('drift') ? 'High (+2.8)' : 'Nominal'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Configurable Weight Sliders */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                Trust Function Evidence Weights
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={resetWeights}
              >
                <RotateCcw size={12} />
                Defaults
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Random Forest Supervised Weight:</span>
                  <span className="mono" style={{ fontWeight: 800 }}>{(weights.w_rf_supervised * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.60}
                  step={0.05}
                  value={weights.w_rf_supervised}
                  onChange={(e) => handleWeightChange('w_rf_supervised', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>1D-CNN Reconstruction Residual:</span>
                  <span className="mono" style={{ fontWeight: 800 }}>{(weights.w_ae_reconstruction * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.50}
                  step={0.05}
                  value={weights.w_ae_reconstruction}
                  onChange={(e) => handleWeightChange('w_ae_reconstruction', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Isolation Forest Density Outlier:</span>
                  <span className="mono" style={{ fontWeight: 800 }}>{(weights.w_iso_forest * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.40}
                  step={0.05}
                  value={weights.w_iso_forest}
                  onChange={(e) => handleWeightChange('w_iso_forest', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>CUSUM/EWMA Drift Detection:</span>
                  <span className="mono" style={{ fontWeight: 800 }}>{(weights.w_change_detection * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.40}
                  step={0.05}
                  value={weights.w_change_detection}
                  onChange={(e) => handleWeightChange('w_change_detection', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {saveMessage && (
              <div style={{ background: '#d1fae5', color: '#065f46', padding: '6px 10px', borderRadius: '6px', fontSize: '0.74rem', marginTop: '10px', fontWeight: 600 }}>
                ✓ {saveMessage}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '14px', fontSize: '0.8rem', fontWeight: 700 }}
              onClick={saveWeights}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Apply & Persist Weights'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorHealthPage;
