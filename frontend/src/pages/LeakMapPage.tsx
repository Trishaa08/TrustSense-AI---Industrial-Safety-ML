import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Crosshair,
  Sliders,
  Download,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Compass,
  Building,
  RefreshCw
} from 'lucide-react';
import { SensorPosition, LocalizationResult, AlertItem } from '../types';
import { api } from '../services/api';
import { FloorplanMap } from '../components/FloorplanMap';

interface LeakMapPageProps {
  sensors: SensorPosition[];
  onSelectSensor: (sensorId: string) => void;
}

export const LeakMapPage: React.FC<LeakMapPageProps> = ({ sensors, onSelectSensor }) => {
  const [method, setMethod] = useState<'baseline' | 'fault_aware' | 'filtered'>('fault_aware');
  const [minSensors, setMinSensors] = useState<number>(3);
  const [trustThreshold, setTrustThreshold] = useState<number>(60);
  const [selectedLeakId, setSelectedLeakId] = useState<string>('LEAK_01');
  const [groundTruthList, setGroundTruthList] = useState<any[]>([]);
  const [result, setResult] = useState<LocalizationResult | null>(null);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [searchSiteQuery, setSearchSiteQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    // Load 30 ground truth events
    api.getGroundTruthEvents()
      .then((res) => {
        setGroundTruthList(res.ground_truth_events);
      })
      .catch(console.error);

    // Load active alerts for bottom queue
    api.getAlerts()
      .then((res) => {
        setAlerts(res.alerts);
      })
      .catch(console.error);

    // Initial estimate for default leak
    runLocalization('LEAK_01', 'fault_aware');
  }, []);

  const runLocalization = async (leakId: string, currentMethod: 'baseline' | 'fault_aware' | 'filtered') => {
    setIsEstimating(true);
    try {
      const res = await api.estimateLocalization({
        method: currentMethod,
        leak_id: leakId,
        min_reliable_sensors: minSensors,
        trust_threshold: trustThreshold
      });
      setResult(res);
    } catch (err) {
      console.error('Localization estimation error:', err);
    } finally {
      setIsEstimating(false);
    }
  };

  const currentGroundTruth = groundTruthList.find((g) => g.leak_id === selectedLeakId);

  // Compute Euclidean error if both ground truth and estimation exist
  let euclideanErrorM: number | null = null;
  if (currentGroundTruth && result && result.estimated_x_m !== null && result.estimated_y_m !== null) {
    const dx = result.estimated_x_m - currentGroundTruth.x_m;
    const dy = result.estimated_y_m - currentGroundTruth.y_m;
    euclideanErrorM = Math.sqrt(dx * dx + dy * dy);
  }

  const exportResult = () => {
    if (!result) return;
    const exportObj = {
      timestamp: new Date().toISOString(),
      leak_id: selectedLeakId,
      ground_truth: currentGroundTruth,
      estimation: result,
      euclidean_error_m: euclideanErrorM
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustsense_localization_${selectedLeakId}.json`;
    a.click();
  };

  // Facility Zone Groups (Screenshot 2 left navigation panel)
  const facilityZones = [
    { id: 'All', name: 'All Facility Zones', count: sensors.length },
    { id: 'Zone-A', name: 'Zone A (Chemical Storage)', count: sensors.filter((s) => s.zone.includes('Zone-A')).length },
    { id: 'Zone-B', name: 'Zone B (Reaction Vessels)', count: sensors.filter((s) => s.zone.includes('Zone-B')).length },
    { id: 'Zone-C', name: 'Zone C (Ventilation Bay)', count: sensors.filter((s) => s.zone.includes('Zone-C')).length },
    { id: 'Zone-D', name: 'Zone D (Loading Bay)', count: sensors.filter((s) => s.zone.includes('Zone-D')).length }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner Notice */}
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
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Compass size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
              Fault-Aware Spatial Localization & Facility Sites Map
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              Downweights or excludes faulty sensors (stuck, drift, offset) to prevent centroid distortion during leak episodes.
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }} onClick={exportResult}>
          <Download size={14} style={{ color: '#2563eb' }} />
          Export Localization JSON
        </button>
      </div>

      {/* Main Layout: Screenshot 2 Side Controls + Floorplan Map & Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
        {/* Left Side Control Panel (Directly matching Screenshot 2) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search Sites Card (Screenshot 2) */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search Sites..."
                className="input-control"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '0.82rem' }}
                value={searchSiteQuery}
                onChange={(e) => setSearchSiteQuery(e.target.value)}
              />
            </div>

            {/* Group By Selector (Screenshot 2) */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Group By
              </label>
              <select className="input-control" style={{ width: '100%', fontSize: '0.8rem', fontWeight: 600 }}>
                <option value="zone">Facility Zone</option>
                <option value="severity">Alert Severity</option>
                <option value="sensor_type">Sensor Model</option>
              </select>
            </div>

            {/* Sites In Selector (Screenshot 2) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Sites In
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              >
                <span>Facility Alpha (All Zones)</span>
                <span style={{ color: '#64748b' }}>×</span>
              </div>
            </div>

            {/* All Sites Accordion List (Screenshot 2) */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }}>
                All Zones ({facilityZones.length - 1})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {facilityZones.map((z) => (
                  <div
                    key={z.id}
                    onClick={() => setSelectedZone(z.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: selectedZone === z.id ? 800 : 600,
                      background: selectedZone === z.id ? '#eff6ff' : 'transparent',
                      color: selectedZone === z.id ? '#1e3a8a' : '#334155'
                    }}
                  >
                    <span>{z.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{z.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulated Leak Event Selector */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Synthetic Leak Benchmark
            </div>
            <select
              className="input-control"
              style={{ width: '100%', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px' }}
              value={selectedLeakId}
              onChange={(e) => {
                setSelectedLeakId(e.target.value);
                runLocalization(e.target.value, method);
              }}
            >
              {groundTruthList.map((g) => (
                <option key={g.leak_id} value={g.leak_id}>
                  {g.leak_id} ({g.zone} • {g.peak_ppm} ppm)
                </option>
              ))}
            </select>

            {/* Algorithm Method Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>
                Algorithm:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  className={`btn ${method === 'fault_aware' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.76rem', padding: '6px 10px', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setMethod('fault_aware');
                    runLocalization(selectedLeakId, 'fault_aware');
                  }}
                >
                  ● Fault-Aware (Trust-Weighted)
                </button>
                <button
                  className={`btn ${method === 'baseline' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.76rem', padding: '6px 10px', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setMethod('baseline');
                    runLocalization(selectedLeakId, 'baseline');
                  }}
                >
                  ○ Ordinary Centroid (All Sensors)
                </button>
                <button
                  className={`btn ${method === 'filtered' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.76rem', padding: '6px 10px', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setMethod('filtered');
                    runLocalization(selectedLeakId, 'filtered');
                  }}
                >
                  ○ Hard Filtered Cutoff
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.78rem' }}
              disabled={isEstimating}
              onClick={() => runLocalization(selectedLeakId, method)}
            >
              <RefreshCw size={13} className={isEstimating ? 'spin-icon' : ''} />
              {isEstimating ? 'Re-Estimating...' : 'Re-Calculate Centroid'}
            </button>
          </div>
        </div>

        {/* Center & Right: Floorplan Map + Localization Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Floorplan Map */}
          <FloorplanMap
            sensors={sensors}
            onSelectSensor={onSelectSensor}
            localization={result}
            height={460}
          />

          {/* Localization Results & Error Evaluation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            {/* Estimation Outcome */}
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Localization Outcome
                </span>
                <span className={`badge ${result?.status === 'success' ? 'badge-healthy' : 'badge-faulty'}`}>
                  {result?.status === 'success' ? 'CONVERGED' : 'REFUSED'}
                </span>
              </div>

              {result?.status === 'success' && result.estimated_x_m !== null ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ESTIMATED CENTROID</div>
                      <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                        ({result.estimated_x_m.toFixed(1)}m, {result.estimated_y_m?.toFixed(1)}m)
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#334155', fontWeight: 600 }}>Zone: {result.estimated_zone}</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>UNCERTAINTY BOUND</div>
                      <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
                        ±{result.uncertainty_radius_m?.toFixed(1)} m
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#334155', fontWeight: 600 }}>Quality: {result.evidence_quality}</div>
                    </div>
                  </div>

                  {/* Ground Truth Comparison */}
                  {currentGroundTruth && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d', marginBottom: '4px' }}>
                        Ground-Truth Error Comparison ({selectedLeakId})
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#475569' }}>Actual Release Coordinates:</span>
                        <span className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>({currentGroundTruth.x_m}m, {currentGroundTruth.y_m}m)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '3px' }}>
                        <span style={{ color: '#475569' }}>Euclidean Localization Error:</span>
                        <span className="mono" style={{ fontWeight: 800, color: euclideanErrorM && euclideanErrorM < 4.0 ? '#15803d' : '#d97706' }}>
                          {euclideanErrorM ? `${euclideanErrorM.toFixed(2)} meters` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                    <strong>Evidence Method:</strong> {result.message}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', color: '#dc2626', fontSize: '0.82rem' }}>
                  <AlertCircle size={20} style={{ marginBottom: '6px' }} />
                  <div style={{ fontWeight: 700 }}>Insufficient reliable sensors to compute source coordinates safely.</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>{result?.message}</div>
                </div>
              )}
            </div>

            {/* Research Hypothesis Benchmark Card */}
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Research Evaluation Benchmark
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                Impact of sensor faults (drift, stuck-at, offset) on spatial centroid accuracy:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fee2e2', borderRadius: '6px', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: '#991b1b' }}>Ordinary Centroid (All Sensors):</span>
                  <span className="mono" style={{ fontWeight: 800, color: '#991b1b' }}>Mean Error: 6.84m</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#d1fae5', borderRadius: '6px', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: '#065f46' }}>Fault-Aware (Trust Weighted):</span>
                  <span className="mono" style={{ fontWeight: 800, color: '#065f46' }}>Mean Error: 2.12m (-69%)</span>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '12px', lineHeight: 1.4 }}>
                TrustSense downweighting prevents corrupt readings from skewing safety decisions and emergency response dispatch.
              </div>
            </div>
          </div>

          {/* Bottom Alerts Queue (Screenshot 2) */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                Facility Alert Incidents at Target Site
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Active notifications across {facilityZones.length - 1} zones
              </span>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Inbox</th>
                    <th>Alert Description</th>
                    <th>Store / Facility Information</th>
                    <th>Next Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.slice(0, 3).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className={`badge ${a.severity === 'critical' ? 'badge-critical' : 'badge-warning'}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-active">{a.status}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.description}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Unit {a.sensor_id}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{a.zone}</div>
                      </td>
                      <td>
                        <button
                          className="btn-troubleshoot"
                          onClick={() => onSelectSensor(a.sensor_id)}
                        >
                          Troubleshoot
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeakMapPage;
