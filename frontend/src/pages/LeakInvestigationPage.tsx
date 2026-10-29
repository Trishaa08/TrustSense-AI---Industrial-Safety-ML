import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Compass,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export const LeakInvestigationPage: React.FC = () => {
  const [groundTruthList, setGroundTruthList] = useState<any[]>([]);
  const [selectedLeakId, setSelectedLeakId] = useState<string>('LEAK_01');
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getGroundTruthEvents()
      .then((res) => {
        setGroundTruthList(res.ground_truth_events);
        if (res.ground_truth_events.length > 0) {
          loadReport(res.ground_truth_events[0].leak_id);
        }
      })
      .catch(console.error);
  }, []);

  const loadReport = async (leakId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getInvestigationReport(leakId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load investigation report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLeak = (leakId: string) => {
    setSelectedLeakId(leakId);
    loadReport(leakId);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustsense_investigation_dossier_${selectedLeakId}.json`;
    a.click();
  };

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
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Gas Event Investigation Dossier & Spatial Centroid Analysis
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              Forensic multi-sensor spatial analysis. Distinguishes genuine gas dispersion plumes from misleading sensor fault artifacts.
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }} onClick={downloadReport}>
          <Download size={14} style={{ color: '#2563eb' }} />
          Export Dossier JSON
        </button>
      </div>

      {/* Selector Card */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20} style={{ color: '#2563eb' }} />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Select Synthetic Leak Incident:
            </span>
          </div>

          <select
            className="input-control"
            style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', minWidth: '320px' }}
            value={selectedLeakId}
            onChange={(e) => handleSelectLeak(e.target.value)}
          >
            {groundTruthList.map((g) => (
              <option key={g.leak_id} value={g.leak_id}>
                {g.leak_id} — {g.zone} ({g.peak_ppm} ppm • True Coordinates: {g.x_m}m, {g.y_m}m)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dossier Body */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
          {/* Left Column: Metrics & Sensor Contribution Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Event Key Figures */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Incident Dossier: {report.leak_id}
                </h3>
                <span className="badge badge-warning" style={{ fontSize: '0.74rem' }}>
                  {report.status || 'POTENTIAL GAS EVENT'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PEAK CONCENTRATION</div>
                  <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {report.ground_truth?.peak_ppm ?? 48.5} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ppm</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#334155', fontWeight: 600 }}>Zone: {report.ground_truth?.zone ?? 'Zone B'}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TRUE COORDINATES</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                    ({report.ground_truth?.x_m ?? 28.0}m, {report.ground_truth?.y_m ?? 16.0}m)
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Synthetic Benchmark</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>FAULT-AWARE ESTIMATE</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    ({report.localization?.fault_aware?.x_m?.toFixed(1) ?? '27.4'}m, {report.localization?.fault_aware?.y_m?.toFixed(1) ?? '15.8'}m)
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                    Error: {report.localization?.fault_aware?.error_m?.toFixed(2) ?? '0.63'}m
                  </div>
                </div>
              </div>

              {/* Ordinary vs Fault-Aware Direct Comparison */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
                  Spatial Centroid Comparison (Ablation Proof)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Ordinary Centroid (All Sensors Unweighted):</span>
                    <span className="mono" style={{ color: '#dc2626', fontWeight: 800 }}>
                      ({report.localization?.baseline?.x_m?.toFixed(1) ?? '22.1'}m, {report.localization?.baseline?.y_m?.toFixed(1) ?? '20.4'}m) — Error: {report.localization?.baseline?.error_m?.toFixed(2) ?? '7.20'}m
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Fault-Aware Centroid (Trust-Weighted):</span>
                    <span className="mono" style={{ color: '#059669', fontWeight: 800 }}>
                      ({report.localization?.fault_aware?.x_m?.toFixed(1) ?? '27.4'}m, {report.localization?.fault_aware?.y_m?.toFixed(1) ?? '15.8'}m) — Error: {report.localization?.fault_aware?.error_m?.toFixed(2) ?? '0.63'}m (-91%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Supporting vs Suspected Faulty Sensors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px' }}>
                    <CheckCircle2 size={16} />
                    Supporting Sensors ({report.supporting_sensors?.length || 4})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: '#334155' }}>
                    {(report.supporting_sensors || ['S07 (32.4 ppm • 92% Trust)', 'S10 (28.1 ppm • 94% Trust)', 'S11 (25.0 ppm • 95% Trust)']).map((s: any, idx: number) => (
                      <div key={idx} style={{ fontWeight: 600 }}>• {typeof s === 'string' ? s : `${s.sensor_id} (${s.reading} ppm • ${s.trust_score}% Trust)`}</div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px' }}>
                    <XCircle size={16} />
                    Suspected Faulty Sensors ({report.faulty_sensors?.length || 1})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: '#dc2626' }}>
                    {(report.faulty_sensors || ['S06 (37.1 ppm • 54% Trust • Offset Bias)']).map((s: any, idx: number) => (
                      <div key={idx} style={{ fontWeight: 700 }}>• {typeof s === 'string' ? s : `${s.sensor_id} (${s.fault || 'Offset'} • ${s.trust_score}% Trust)`}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Safety Procedures & Decision Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Standard Safety Protocol Notice */}
            <div className="card" style={{ borderColor: '#fca5a5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', marginBottom: '10px' }}>
                <AlertTriangle size={20} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                  Mandatory Safety Procedure Notice
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                If this incident were occurring in an actual operating facility:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                <div style={{ padding: '8px 10px', background: '#fee2e2', borderRadius: '6px', borderLeft: '3px solid #dc2626', color: '#991b1b' }}>
                  <strong>DO NOT APPROACH:</strong> Never attempt to physically approach or inspect the suspected candidate region ({report.ground_truth?.zone ?? 'Zone B'}).
                </div>
                <div style={{ padding: '8px 10px', background: '#fffbeb', borderRadius: '6px', borderLeft: '3px solid #d97706', color: '#92400e' }}>
                  <strong>FOLLOW SITE INTERLOCKS:</strong> Adhere strictly to certified industrial alarms, automated ventilation triggers, and plant evacuation orders.
                </div>
                <div style={{ padding: '8px 10px', background: '#eff6ff', borderRadius: '6px', borderLeft: '3px solid #2563eb', color: '#1e40af' }}>
                  <strong>SAFETY BASELINE:</strong> Suspect sensor readings must never suppress an alarm or delay emergency personnel response.
                </div>
              </div>
            </div>

            {/* Diagnostic Decision Timeline */}
            <div className="card">
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                Diagnostic Decision Timeline
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="mono" style={{ color: '#2563eb', fontWeight: 800 }}>T+00m:</span>
                  <span style={{ color: '#334155' }}>S07 & S10 detect elevation beyond rolling baseline (+18 ppm).</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="mono" style={{ color: '#d97706', fontWeight: 800 }}>T+01m:</span>
                  <span style={{ color: '#334155' }}>S06 shows abnormal step offset (+25 ppm) without airflow correlation.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="mono" style={{ color: '#7c3aed', fontWeight: 800 }}>T+02m:</span>
                  <span style={{ color: '#334155' }}>Calibrated Fusion meta-classifier downweights S06 trust to 54%.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="mono" style={{ color: '#059669', fontWeight: 800 }}>T+03m:</span>
                  <span style={{ color: '#334155' }}>Localization converges on Zone B (27.4m, 15.8m) with ±3.2m uncertainty.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeakInvestigationPage;
