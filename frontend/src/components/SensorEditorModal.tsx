import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Zap,
  Activity,
  Layers,
  Info,
  ShieldCheck
} from 'lucide-react';
import { SensorPosition, ModifySensorResponse } from '../types';
import { api } from '../services/api';

interface SensorEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensors: SensorPosition[];
  selectedSensorId: string;
  onSelectSensor: (sensorId: string) => void;
  onRefreshAll: () => void;
}

export const SensorEditorModal: React.FC<SensorEditorModalProps> = ({
  isOpen,
  onClose,
  sensors,
  selectedSensorId,
  onSelectSensor,
  onRefreshAll
}) => {
  const currentSensor = sensors.find((s) => s.sensor_id === selectedSensorId) || sensors[0];

  const [gasReading, setGasReading] = useState<number>(currentSensor?.current_reading ?? 12.0);
  const [temperature, setTemperature] = useState<number>(22.0);
  const [humidity, setHumidity] = useState<number>(50.0);
  const [airflow, setAirflow] = useState<number>(0.5);
  const [posX, setPosX] = useState<number>(currentSensor?.x_m ?? 10.0);
  const [posY, setPosY] = useState<number>(currentSensor?.y_m ?? 10.0);
  const [injectedFault, setInjectedFault] = useState<string>(
    currentSensor?.suspected_fault && currentSensor.suspected_fault !== 'none'
      ? currentSensor.suspected_fault
      : 'none'
  );

  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: ModifySensorResponse;
  } | null>(null);

  // Sync state when selectedSensor changes
  useEffect(() => {
    if (currentSensor) {
      setGasReading(currentSensor.current_reading);
      setPosX(currentSensor.x_m);
      setPosY(currentSensor.y_m);
      setInjectedFault(
        currentSensor.suspected_fault && currentSensor.suspected_fault !== 'none'
          ? currentSensor.suspected_fault
          : 'none'
      );
      setFeedback(null);
    }
  }, [selectedSensorId, currentSensor?.sensor_id]);

  if (!isOpen) return null;

  const handleApplyChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSensor) return;

    // Schema Validation
    if (gasReading < 0 || gasReading > 250) {
      setFeedback({ type: 'error', message: 'Gas reading must be within 0.0 to 250.0 ppm.' });
      return;
    }
    if (temperature < -20 || temperature > 70) {
      setFeedback({ type: 'error', message: 'Temperature must be within -20.0 to 70.0 °C.' });
      return;
    }
    if (humidity < 0 || humidity > 100) {
      setFeedback({ type: 'error', message: 'Humidity must be within 0 to 100% RH.' });
      return;
    }
    if (posX < 0 || posX > 100 || posY < 0 || posY > 100) {
      setFeedback({ type: 'error', message: 'Coordinates must be within 0.0 to 100.0 meters.' });
      return;
    }

    setIsApplying(true);
    setFeedback(null);

    try {
      const response = await api.modifySensor(currentSensor.sensor_id, {
        gas_reading: Number(gasReading),
        temperature_c: Number(temperature),
        humidity_pct: Number(humidity),
        airflow_m_s: Number(airflow),
        x_m: Number(posX),
        y_m: Number(posY),
        injected_fault: injectedFault,
        fault_params: { applied_by_user: true }
      });

      setFeedback({
        type: 'success',
        message: response.message || 'Observation applied and model pipeline executed.',
        details: response
      });

      // Refresh entire app state
      onRefreshAll();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to modify sensor observation.'
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetToDemo = async () => {
    if (!window.confirm('Reset all sensors and simulated observations back to immutable demo CSV baseline?')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.resetDemoSensors();
      setFeedback({
        type: 'info',
        message: res.message || 'All sensor overrides reset to demo baseline.'
      });
      onRefreshAll();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to reset demo baseline.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const isUserModified = currentSensor?.is_user_modified || false;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '680px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.18)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Sensor Telemetry & Fault Editor
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Interactively alter observations & inject faults without modifying original source CSV files.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Provenance Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Sensor:</span>
            <select
              className="input-control"
              value={selectedSensorId}
              onChange={(e) => onSelectSensor(e.target.value)}
              style={{ fontWeight: 700, padding: '4px 10px', fontSize: '0.85rem' }}
            >
              {sensors.map((s) => (
                <option key={s.sensor_id} value={s.sensor_id}>
                  {s.sensor_id} ({s.zone}) — {s.current_reading} ppm [{s.health_status}]
                </option>
              ))}
            </select>
          </div>

          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: isUserModified ? '#fef3c7' : '#f0fdfa',
              color: isUserModified ? '#b45309' : '#0f766e',
              border: `1px solid ${isUserModified ? '#fde68a' : '#99f6e4'}`
            }}
          >
            {isUserModified ? 'Simulation: User-Modified' : 'Source: Demo CSV'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApplyChanges}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
            {/* Gas Concentration */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Gas Concentration (ppm eq)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="250"
                className="input-control"
                style={{ width: '100%' }}
                value={gasReading}
                onChange={(e) => setGasReading(parseFloat(e.target.value) || 0)}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Nominal baseline: ~12.0 ppm | Leak threshold: &gt;25.0 ppm</span>
            </div>

            {/* Injected Fault Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Injected Fault Mode
              </label>
              <select
                className="input-control"
                style={{ width: '100%' }}
                value={injectedFault}
                onChange={(e) => setInjectedFault(e.target.value)}
              >
                <option value="none">None (Nominal Healthy Operation)</option>
                <option value="drift">Drift (Continuous baseline shift)</option>
                <option value="stuck">Stuck-at (Zero variance / frozen reading)</option>
                <option value="offset">Offset / Bias (Fixed step addition)</option>
                <option value="noise_increase">Noise Increase (Elevated std dev)</option>
                <option value="slow_response">Slow Response (Sluggish dynamics)</option>
                <option value="sensitivity_loss">Sensitivity Loss (Attenuated gain)</option>
              </select>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Simulates physical degradation for diagnostic models</span>
            </div>

            {/* Temperature */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Ambient Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                min="-20"
                max="70"
                className="input-control"
                style={{ width: '100%' }}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Standard room nominal: 22.0 °C</span>
            </div>

            {/* Relative Humidity */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Relative Humidity (% RH)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-control"
                style={{ width: '100%' }}
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Standard nominal: 50% RH</span>
            </div>

            {/* Coordinate X */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Sensor Position X (meters)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                className="input-control"
                style={{ width: '100%' }}
                value={posX}
                onChange={(e) => setPosX(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Coordinate Y */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Sensor Position Y (meters)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                className="input-control"
                style={{ width: '100%' }}
                value={posY}
                onChange={(e) => setPosY(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Feedback & Real ML Re-inference Results */}
          {feedback && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background:
                  feedback.type === 'success' ? '#f0fdf4' : feedback.type === 'error' ? '#fef2f2' : '#f0f9ff',
                border: `1px solid ${
                  feedback.type === 'success' ? '#bbf7d0' : feedback.type === 'error' ? '#fecaca' : '#bae6fd'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: feedback.details ? '8px' : '0' }}>
                {feedback.type === 'success' ? (
                  <CheckCircle2 size={16} color="#16a34a" />
                ) : (
                  <AlertTriangle size={16} color={feedback.type === 'error' ? '#dc2626' : '#0284c7'} />
                )}
                <span
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: feedback.type === 'success' ? '#15803d' : feedback.type === 'error' ? '#b91c1c' : '#0369a1'
                  }}
                >
                  {feedback.message}
                </span>
              </div>

              {/* Real ML inference outputs */}
              {feedback.details?.model_predictions && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Live Model Pipeline Re-Evaluation:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', color: 'var(--text-muted)' }}>
                    <div>
                      <strong>Random Forest:</strong>{' '}
                      <span style={{ color: feedback.details.model_predictions.random_forest.is_faulty ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        {feedback.details.model_predictions.random_forest.is_faulty ? 'Faulty' : 'Healthy'}
                      </span>{' '}
                      ({(feedback.details.model_predictions.random_forest.fault_probability * 100).toFixed(1)}%)
                    </div>
                    <div>
                      <strong>XGBoost Fault:</strong>{' '}
                      <span style={{ color: '#0f766e', fontWeight: 700 }}>
                        {feedback.details.model_predictions.xgboost.predicted_fault}
                      </span>{' '}
                      ({(feedback.details.model_predictions.xgboost.confidence * 100).toFixed(0)}%)
                    </div>
                    <div>
                      <strong>Trust Score:</strong>{' '}
                      <span style={{ fontWeight: 700, color: feedback.details.trust_score < 60 ? '#dc2626' : '#16a34a' }}>
                        {feedback.details.trust_score} / 100
                      </span>
                    </div>
                  </div>

                  {/* Real SHAP summary */}
                  {feedback.details.shap_explanation && (
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', color: '#475569', fontSize: '0.75rem' }}>
                      <strong>SHAP Insight:</strong> {feedback.details.shap_explanation.plain_english_summary}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetToDemo}
              disabled={isResetting || isApplying}
              style={{ fontSize: '0.8rem', color: '#64748b' }}
            >
              <RotateCcw size={14} className={isResetting ? 'spin-icon' : ''} />
              {isResetting ? 'Resetting...' : 'Reset to Demo Baseline'}
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isApplying}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isApplying}
              >
                <Zap size={14} className={isApplying ? 'spin-icon' : ''} />
                {isApplying ? 'Evaluating Models...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
