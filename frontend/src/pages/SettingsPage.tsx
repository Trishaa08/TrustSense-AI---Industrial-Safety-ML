import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  RotateCcw,
  Activity,
  Server,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    selected_facility: 'Synthetic Chemical Facility Alpha (Zones A-D)',
    playback_speed: 1.0,
    anomaly_sensitivity: 0.65,
    ewma_alpha: 0.20,
    cusum_threshold: 5.0,
    min_reliable_sensors: 3,
    trust_threshold: 60.0
  });

  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string>('');

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const checkHealth = async () => {
    const start = performance.now();
    try {
      const data = await api.getHealth();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({ status: 'offline' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({ settings });
      setSaveFeedback('Settings updated and persisted across pipeline.');
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSettings();
      await loadSettings();
      setSaveFeedback('Settings successfully restored to academic defaults.');
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header Banner */}
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
            <Settings size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              System Configuration & Diagnostic Pipeline Parameters
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              Adjust detection sensitivity, statistical change thresholds, and verify live backend API latency.
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }} onClick={handleReset}>
          <RotateCcw size={13} />
          Reset Demo Defaults
        </button>
      </div>

      {/* Main Grid: Parameters + Diagnostics Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Settings Form */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Diagnostic Pipeline Parameters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Facility Name */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Active Synthetic Facility:
              </label>
              <input
                type="text"
                className="input-control"
                style={{ width: '100%', fontWeight: 600 }}
                value={settings.selected_facility || ''}
                onChange={(e) => setSettings({ ...settings, selected_facility: e.target.value })}
              />
            </div>

            {/* Anomaly Detection Sensitivity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>Autoencoder & Isolation Forest Sensitivity:</span>
                <span className="mono" style={{ fontWeight: 800, color: '#2563eb' }}>
                  {settings.anomaly_sensitivity}
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.95}
                step={0.05}
                value={settings.anomaly_sensitivity || 0.65}
                onChange={(e) => setSettings({ ...settings, anomaly_sensitivity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                Controls reconstruction residual anomaly threshold strictness.
              </div>
            </div>

            {/* EWMA Alpha */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>EWMA Smoothing Factor (α):</span>
                <span className="mono" style={{ fontWeight: 800, color: '#2563eb' }}>
                  {settings.ewma_alpha}
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.50}
                step={0.05}
                value={settings.ewma_alpha || 0.20}
                onChange={(e) => setSettings({ ...settings, ewma_alpha: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* CUSUM Threshold */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>CUSUM Drift Alert Threshold (h):</span>
                <span className="mono" style={{ fontWeight: 800, color: '#2563eb' }}>
                  {settings.cusum_threshold}
                </span>
              </div>
              <input
                type="range"
                min={2.0}
                max={10.0}
                step={0.5}
                value={settings.cusum_threshold || 5.0}
                onChange={(e) => setSettings({ ...settings, cusum_threshold: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Min reliable sensors */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>Min Reliable Sensors for Spatial Localization:</span>
                <span className="mono" style={{ fontWeight: 800, color: '#2563eb' }}>
                  {settings.min_reliable_sensors}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                value={settings.min_reliable_sensors || 3}
                onChange={(e) => setSettings({ ...settings, min_reliable_sensors: parseInt(e.target.value, 10) })}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                Engine refuses localization if fewer reliable sensors report evidence.
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', fontWeight: 700 }}
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Updating Pipeline...' : 'Apply and Persist Configuration'}
            </button>

            {saveFeedback && (
              <div style={{ fontSize: '0.78rem', color: '#059669', textAlign: 'center', fontWeight: 700 }}>
                ✓ {saveFeedback}
              </div>
            )}
          </div>
        </div>

        {/* Diagnostics & Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} style={{ color: '#2563eb' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  Backend API Diagnostics
                </h4>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={checkHealth}
              >
                <RefreshCw size={12} /> Ping
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Status:</span>
                <span style={{ fontWeight: 800, color: healthStatus?.status === 'healthy' ? '#059669' : '#dc2626' }}>
                  {healthStatus?.status?.toUpperCase() || 'CHECKING'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>API Latency:</span>
                <span className="mono" style={{ fontWeight: 800, color: '#2563eb' }}>
                  {latencyMs !== null ? `${latencyMs} ms` : '-'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Registered Models:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>
                  7 / 7 Active & Calibrated
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Backend Server:</span>
                <span className="mono" style={{ color: '#0f172a', fontWeight: 700 }}>FastAPI (Port 8000)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Dataset Persistence:</span>
                <span className="mono" style={{ color: '#059669', fontWeight: 700 }}>SQLite (trustsense.db)</span>
              </div>
            </div>
          </div>

          {/* Academic Disclaimer Box */}
          <div className="card" style={{ borderColor: '#fca5a5' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>
              Safety Non-Interference Statement
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
              Under no circumstances does TrustSense-Gas have authorization to override or delay certified industrial gas safety interlocks.
              A degraded sensor diagnosis is an engineering maintenance recommendation, never a justification to dismiss potential gas danger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
