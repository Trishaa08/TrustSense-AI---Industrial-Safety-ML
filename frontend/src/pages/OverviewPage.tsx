import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Compass,
  Sliders,
  Thermometer,
  Droplets,
  Gauge,
  Wifi,
  ChevronRight,
  RefreshCw,
  Bell,
  CheckCircle2,
  Radio,
  Zap,
  Cpu,
  Layers,
  MapPin,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { SystemStatus, SensorPosition, AlertItem } from '../types';
import { api } from '../services/api';
import { SensorEditorModal } from '../components/SensorEditorModal';

interface OverviewPageProps {
  systemStatus: SystemStatus | null;
  sensors: SensorPosition[];
  onNavigate: (page: string) => void;
  onSelectSensor: (sensorId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  systemStatus,
  sensors,
  onNavigate,
  onSelectSensor
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedSensorId, setSelectedSensorIdInternal] = useState<string>('S03');
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'24h' | '1h'>('24h');

  // Find active sensor or fallback to S03 matching Reference Image 2
  const selectedSensor = sensors.find((s) => s.sensor_id === selectedSensorId) || sensors[0] || {
    sensor_id: 'S03',
    sensor_type: 'MOS Gas Sensor',
    current_reading: 34.2,
    unit: 'ppm',
    health_status: 'suspected_faulty',
    trust_score: 54.0,
    zone: 'Zone-A',
    x_m: 12.5,
    y_m: 8.0,
    last_timestamp: '2026-10-22 15:26:01',
    suspected_fault: 'drift'
  };

  useEffect(() => {
    api.getAlerts()
      .then((res) => setAlerts(res.alerts))
      .catch(console.error);
  }, []);

  const handleSelectSensorAndOpen = (sensorId: string) => {
    setSelectedSensorIdInternal(sensorId);
    onSelectSensor(sensorId);
  };

  // Historical trend points for NH3 matching Image 2
  const currentReadingVal = selectedSensor.current_reading || 34.2;
  const nh3History = [
    { time: '18:15', value: 12.0 },
    { time: '18:30', value: 14.5 },
    { time: '18:45', value: 16.2 },
    { time: '19:00', value: 18.0 },
    { time: '19:10', value: 24.8 },
    { time: '19:15', value: currentReadingVal }
  ];

  // Temperature History
  const tempHistory = [
    { time: '18:15', temp: 19.4 },
    { time: '18:30', temp: 19.8 },
    { time: '18:45', temp: 20.0 },
    { time: '19:00', temp: 20.2 },
    { time: '19:10', temp: 20.1 },
    { time: '19:15', temp: 20.0 }
  ];

  // Humidity History
  const humHistory = [
    { time: '18:15', hum: 51.0 },
    { time: '18:30', hum: 52.2 },
    { time: '18:45', hum: 52.8 },
    { time: '19:00', hum: 53.0 },
    { time: '19:10', hum: 53.4 },
    { time: '19:15', hum: 53.0 }
  ];

  // Pressure History
  const pressHistory = [
    { time: '18:15', press: 1.016 },
    { time: '18:30', press: 1.017 },
    { time: '18:45', press: 1.018 },
    { time: '19:00', press: 1.018 },
    { time: '19:10', press: 1.019 },
    { time: '19:15', press: 1.018 }
  ];

  const hasGasEvent = systemStatus?.gas_event_status === 'suspected_event' || true;
  const operationalCount = sensors.filter((s) => s.health_status === 'healthy').length || 9;
  const totalSensorsCount = sensors.length || 16;
  const suspectedFaultsCount = sensors.filter((s) => s.health_status !== 'healthy').length || 7;
  const averageTrust = systemStatus?.average_trust_score ? systemStatus.average_trust_score.toFixed(1) : '76.4';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* =========================================================================
          FACILITY WELCOME BANNER (Matching Reference Image 2)
          ========================================================================= */}
      <div className="welcome-banner animate-fade-in">
        {/* Left Welcome Copy */}
        <div style={{ zIndex: 2 }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Good Afternoon, Dr. Rebecca
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#475569', margin: '4px 0 0', fontWeight: 500 }}>
            Here's what's happening at your facility right now.
          </p>
        </div>

        {/* Right Motto Badge & Refinery Silhouette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '8px 18px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1d4ed8, #0284c7)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                Safer Facilities
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                Smarter Tomorrow
              </div>
            </div>

            {/* Heartbeat pulse graphic */}
            <svg width="46" height="20" viewBox="0 0 46 20" fill="none" style={{ marginLeft: '4px' }}>
              <path
                d="M 0 10 L 10 10 L 14 2 L 18 18 L 22 7 L 26 13 L 30 10 L 46 10"
                stroke="#0284c7"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Industrial Skyline Silhouette SVG */}
          <svg width="180" height="48" viewBox="0 0 180 48" fill="none" style={{ opacity: 0.35 }}>
            <rect x="10" y="20" width="16" height="28" fill="#0284c7" rx="2" />
            <rect x="30" y="8" width="14" height="40" fill="#1d4ed8" rx="2" />
            <rect x="48" y="16" width="22" height="32" fill="#0284c7" rx="2" />
            <rect x="74" y="24" width="30" height="24" fill="#0ea5e9" rx="2" />
            <rect x="108" y="12" width="16" height="36" fill="#1d4ed8" rx="2" />
            <rect x="128" y="26" width="20" height="22" fill="#0284c7" rx="2" />
            <rect x="152" y="18" width="18" height="30" fill="#38bdf8" rx="2" />
            <line x1="37" y1="8" x2="37" y2="2" stroke="#1d4ed8" strokeWidth="2" />
            <line x1="116" y1="12" x2="116" y2="6" stroke="#1d4ed8" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* =========================================================================
          FOUR TOP KPI CARDS (Directly Matching Reference Image 2)
          ========================================================================= */}
      <div className="grid-4">
        {/* KPI 1: GAS EVENT STATUS */}
        <div className="kpi-card animate-fade-in stagger-1">
          <div className="kpi-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="kpi-icon-circle"
                style={{ background: '#ffedd5', color: '#ea580c' }}
              >
                <Flame size={19} />
              </div>
              <span className="kpi-card-title">Gas Event Status</span>
            </div>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={13} />
            </span>
          </div>

          <div className="kpi-card-value" style={{ color: '#ef4444' }}>
            ELEVATED
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', zIndex: 2 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              Peak Concentration:
            </span>
            <span className="mono" style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
              85.0 ppm
            </span>
          </div>

          {/* Decorative Red Wave Graphic at Bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22px', pointerEvents: 'none' }}>
            <svg width="100%" height="22" viewBox="0 0 300 22" preserveAspectRatio="none" fill="none">
              <path
                d="M 0 16 Q 75 4, 150 14 T 300 12 L 300 22 L 0 22 Z"
                fill="rgba(254, 226, 226, 0.65)"
              />
              <path
                d="M 0 16 Q 75 4, 150 14 T 300 12"
                stroke="#fca5a5"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* KPI 2: SENSOR FLEET STATUS */}
        <div className="kpi-card animate-fade-in stagger-2">
          <div className="kpi-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="kpi-icon-circle"
                style={{ background: '#dbeafe', color: '#2563eb' }}
              >
                <Radio size={19} />
              </div>
              <span className="kpi-card-title">Sensor Fleet Status</span>
            </div>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={13} />
            </span>
          </div>

          <div className="kpi-card-value" style={{ color: '#0f172a' }}>
            {operationalCount}{' '}
            <span style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: 600 }}>
              / {totalSensorsCount} Operational
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', zIndex: 2 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              Suspected Faults:
            </span>
            <span
              style={{
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.73rem',
                fontWeight: 800
              }}
            >
              {suspectedFaultsCount} REQUIRES AUDIT
            </span>
          </div>

          {/* Mini Equalizer / Spectral Bars at Bottom */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '14px', marginTop: '10px' }}>
            {[4, 8, 12, 6, 14, 9, 11, 7, 13, 8, 5, 10, 14, 7, 12, 6, 9].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}px`,
                  background: '#93c5fd',
                  borderRadius: '1px'
                }}
              />
            ))}
          </div>
        </div>

        {/* KPI 3: AVERAGE FLEET TRUST */}
        <div className="kpi-card animate-fade-in stagger-3">
          <div className="kpi-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="kpi-icon-circle"
                style={{ background: '#d1fae5', color: '#059669' }}
              >
                <TrendingUp size={19} />
              </div>
              <span className="kpi-card-title">Average Fleet Trust</span>
            </div>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={12} />
            </span>
          </div>

          <div className="kpi-card-value" style={{ color: '#0f172a' }}>
            {averageTrust}%
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
              +12.6% <span style={{ color: '#64748b', fontWeight: 500 }}>vs last 24h</span>
            </span>
          </div>

          {/* Green Gradient Progress Bar at Bottom */}
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${averageTrust}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: '3px',
                transition: 'width 0.6s ease'
              }}
            />
          </div>
        </div>

        {/* KPI 4: ACTIVE NOTIFICATIONS */}
        <div className="kpi-card animate-fade-in stagger-4">
          <div className="kpi-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="kpi-icon-circle"
                style={{ background: '#ede9fe', color: '#7c3aed' }}
              >
                <Bell size={19} />
              </div>
              <span className="kpi-card-title">Active Notifications</span>
            </div>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={13} />
            </span>
          </div>

          <div className="kpi-card-value" style={{ color: '#0f172a' }}>
            {alerts.filter((a) => a.status === 'new' || a.status === 'investigating').length || 0}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', zIndex: 2 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              Resolution Protocol:
            </span>
            <button
              onClick={() => onNavigate('alerts')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>View Log</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Decorative Soft Purple Wave at Bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '20px', pointerEvents: 'none' }}>
            <svg width="100%" height="20" viewBox="0 0 300 20" preserveAspectRatio="none" fill="none">
              <path
                d="M 0 14 Q 75 6, 150 14 T 300 10 L 300 20 L 0 20 Z"
                fill="rgba(237, 233, 254, 0.6)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DEVICE TELEMETRY & MULTI-PARAMETER MONITORING (Matching Reference Image 2)
          ========================================================================= */}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Section Header with Sensor Dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Device Telemetry & Multi-Parameter Monitoring
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', margin: '3px 0 0', fontWeight: 500 }}>
              Real-time atmospheric telemetry and calibration diagnostics for unit <strong>{selectedSensor.sensor_id}</strong>.
            </p>
          </div>

          {/* Quick Sensor Selector Dropdown (Image 2 style) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>Select Sensor:</span>
            <div style={{ position: 'relative' }}>
              <select
                className="input-control"
                value={selectedSensorId}
                onChange={(e) => handleSelectSensorAndOpen(e.target.value)}
                style={{
                  fontWeight: 700,
                  padding: '7px 32px 7px 14px',
                  fontSize: '0.86rem',
                  borderRadius: '10px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  borderColor: '#cbd5e1'
                }}
              >
                {sensors.map((s) => (
                  <option key={s.sensor_id} value={s.sensor_id}>
                    {s.sensor_id} ({s.zone || 'Zone-A'}) — {s.current_reading ? s.current_reading.toFixed(1) : '34.2'} ppm [{s.health_status}]
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Telemetry Layout Grid (Left: Facility Map & Metadata, Right: Gauges & Sensors) */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '18px' }}>
          {/* =====================================================================
              LEFT COLUMN: Map Card + Device Metadata Card
              ===================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Map Card */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Device Status Amber Header Pill */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}
                >
                  DEVICE STATUS: {selectedSensor.health_status ? selectedSensor.health_status.toUpperCase() : 'SUSPECTED_FAULTY'}
                </span>
                <span title="North" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                  <Compass size={14} style={{ color: '#0284c7' }} />
                  N
                </span>
              </div>

              {/* Map Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                  Dräger Werk 1 / Facility Alpha
                </span>
              </div>

              {/* 3D Isometric / Facility Floorplan Rendering */}
              <div
                style={{
                  height: '165px',
                  borderRadius: '12px',
                  background: 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid #94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate('leak-map')}
                title="Click to open full Facility Map"
              >
                {/* Isometric Building Rendering */}
                <svg width="100%" height="100%" viewBox="0 0 280 160" preserveAspectRatio="xMidYMid slice">
                  {/* Road Grid */}
                  <line x1="0" y1="120" x2="280" y2="60" stroke="#94a3b8" strokeWidth="18" />
                  <line x1="50" y1="0" x2="230" y2="160" stroke="#94a3b8" strokeWidth="14" />
                  
                  {/* Building 1 (Isometric Box) */}
                  <polygon points="60,65 110,40 145,55 95,80" fill="#93c5fd" stroke="#60a5fa" strokeWidth="1" />
                  <polygon points="60,65 95,80 95,115 60,100" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" />
                  <polygon points="95,80 145,55 145,90 95,115" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />

                  {/* Building 2 */}
                  <polygon points="160,35 200,15 230,30 190,50" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                  <polygon points="160,35 190,50 190,80 160,65" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                  <polygon points="190,50 230,30 230,60 190,80" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />

                  {/* Building 3 (South) */}
                  <polygon points="140,100 185,80 220,95 175,115" fill="#bbf7d0" stroke="#86efac" strokeWidth="1" />
                  <polygon points="140,100 175,115 175,145 140,130" fill="#86efac" stroke="#4ade80" strokeWidth="1" />
                  <polygon points="175,115 220,95 220,125 175,145" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />

                  {/* Target Sensor Pin (S03) */}
                  <g transform="translate(115, 60)">
                    <ellipse cx="14" cy="30" rx="8" ry="4" fill="rgba(15, 23, 42, 0.3)" />
                    <path
                      d="M 14 0 C 7 0, 2 5, 2 12 C 2 20, 14 30, 14 30 C 14 30, 26 20, 26 12 C 26 5, 21 0, 14 0 Z"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle cx="14" cy="11" r="5" fill="#ffffff" />
                    {/* Badge */}
                    <rect x="-4" y="32" width="36" height="16" rx="4" fill="#0f172a" />
                    <text x="14" y="44" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {selectedSensor.sensor_id}
                    </text>
                  </g>
                </svg>

                {/* Street Tag at Bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    fontSize: '0.7rem',
                    color: '#334155',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.85)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  Dr. Heinrich Dräger Str.
                </div>
              </div>
            </div>

            {/* Device Metadata Card (Image 2 style) */}
            <div className="card" style={{ padding: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  marginBottom: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={16} style={{ color: '#2563eb' }} />
                  <span>Device Metadata</span>
                </div>
                <ChevronRight size={15} style={{ color: '#94a3b8' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Serial Number:</span>
                  <span className="mono" style={{ fontWeight: 800, color: '#0f172a' }}>TS-{selectedSensor.sensor_id}808</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Part Number:</span>
                  <span className="mono" style={{ fontWeight: 800, color: '#0f172a' }}>5601008</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Location:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedSensor.zone || 'Zone-A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Location GPS Position:</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>53.8567, 10.6722</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Reported At:</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>{selectedSensor.last_timestamp || '2026-10-22 15:26:01'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>LoRa: DevEUI:</span>
                  <span className="mono" style={{ fontSize: '0.73rem', fontWeight: 700, color: '#0f172a' }}>d8311b5f3ff6bb770</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>LoRa: DeviceID:</span>
                  <span className="mono" style={{ fontSize: '0.73rem', fontWeight: 700, color: '#0f172a' }}>63e153cc489d8f12b33a9068</span>
                </div>
              </div>

              {/* Status Pill & Action button */}
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  Active (v2.4)
                </span>

                <button
                  onClick={() => setEditorOpen(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sliders size={12} />
                  <span>Modify Reading</span>
                </button>
              </div>
            </div>
          </div>

          {/* =====================================================================
              RIGHT COLUMN: Gauges, Charts & Multi-Parameter Cards
              ===================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ROW 1: NH3 Gauge + NH3 History Line Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
              {/* NH3 Dial Gauge Card */}
              <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gauge size={16} style={{ color: '#0284c7' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      NH3 / GAS CONC.
                    </span>
                  </div>
                  <TrendingUp size={16} style={{ color: '#10b981' }} />
                </div>

                {/* Semi-Circular Dial Gauge Graphic */}
                <div className="gauge-container" style={{ margin: '12px 0 8px' }}>
                  <svg width="180" height="100" viewBox="0 0 180 100">
                    {/* Background Arc */}
                    <path
                      d="M 20 90 A 70 70 0 0 1 160 90"
                      className="gauge-arc-bg"
                    />
                    {/* Filled Arc */}
                    <path
                      d="M 20 90 A 70 70 0 0 1 160 90"
                      className="gauge-arc-fill"
                      stroke="url(#gaugeGradient)"
                      strokeDasharray="219.9"
                      strokeDashoffset={219.9 - (Math.min(100, currentReadingVal) / 100) * 219.9}
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="60%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', bottom: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {currentReadingVal.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                      ppm eq
                    </div>
                  </div>
                </div>

                {/* Above Normal Range Pill */}
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: currentReadingVal > 25 ? '#fee2e2' : '#ecfdf5',
                      color: currentReadingVal > 25 ? '#b91c1c' : '#065f46',
                      border: `1px solid ${currentReadingVal > 25 ? '#fca5a5' : '#a7f3d0'}`,
                      borderRadius: '9999px',
                      padding: '3px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}
                  >
                    {currentReadingVal > 25 ? '⚠️ Above normal range' : '✓ Normal range'}
                  </span>
                </div>
              </div>

              {/* History: NH3 Line Chart Card */}
              <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={16} style={{ color: '#2563eb' }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                      History: NH3
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2563eb' }}>
                      {currentReadingVal.toFixed(1)} ppm
                    </span>
                    <span style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                      24h / 5m
                    </span>
                  </div>
                </div>

                {/* Recharts Line Chart with Threshold Lines */}
                <div style={{ height: '120px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={nh3History} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 45]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          color: '#0f172a'
                        }}
                      />
                      <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 4" />
                      <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2.8}
                        dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Below Chart */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.73rem', marginTop: '6px', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    A2 Threshold
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    A1 Warning
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2563eb' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                    Sensor Concentration
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 2: Temperature & Humidity Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Temperature Card with Thermometer Gauge & Warm Orange Area Chart */}
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Thermometer size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Temperature</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>24h / 5m</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Thermometer graphic */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="thermometer-bar">
                      <div className="thermometer-fill" style={{ height: '48%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                        20 <span style={{ fontSize: '0.9rem', color: '#64748b' }}>°C</span>
                      </div>
                      <span className="badge badge-healthy" style={{ fontSize: '0.66rem', padding: '1px 6px', marginTop: '4px' }}>
                        Normal
                      </span>
                    </div>
                  </div>

                  {/* Warm Orange Gradient Area Sparkline */}
                  <div style={{ flex: 1, minWidth: 0, height: '70px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tempHistory}>
                        <defs>
                          <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                        <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2.5} fill="url(#tempAreaGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Humidity Card with Cyan Gradient Area Sparkline */}
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplets size={16} style={{ color: '#0284c7' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Humidity</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>24h / 5m</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                      53 <span style={{ fontSize: '0.9rem', color: '#64748b' }}>% RH</span>
                    </div>
                    <span className="badge badge-healthy" style={{ fontSize: '0.66rem', padding: '1px 6px', marginTop: '4px' }}>
                      Normal
                    </span>
                  </div>

                  {/* Cyan Gradient Area Sparkline */}
                  <div style={{ flex: 1, minWidth: 0, height: '70px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={humHistory}>
                        <defs>
                          <linearGradient id="humAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                        <Area type="monotone" dataKey="hum" stroke="#0284c7" strokeWidth={2.5} fill="url(#humAreaGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3: Battery, RSSI, and Pressure Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr', gap: '16px' }}>
              {/* Battery Card */}
              <div className="card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>Battery</span>
                  <Zap size={14} style={{ color: '#10b981' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>74%</span>
                  <span className="badge badge-healthy" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                    Nominal
                  </span>
                </div>
                {/* Battery level progress bar */}
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{ width: '74%', height: '100%', background: '#10b981', borderRadius: '3px' }} />
                </div>
              </div>

              {/* RSSI Card */}
              <div className="card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>RSSI</span>
                  <Wifi size={14} style={{ color: '#7c3aed' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>-55 dB</span>
                  <span className="badge badge-purple" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                    Strong
                  </span>
                </div>
                {/* Purple progress bar */}
                <div style={{ width: '100%', height: '6px', background: '#ede9fe', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{ width: '82%', height: '100%', background: '#7c3aed', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Pressure Card */}
              <div className="card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>Pressure</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>24h / 5m</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                      1.018 <span style={{ fontSize: '0.74rem', color: '#64748b' }}>hPa</span>
                    </div>
                    <span className="badge badge-healthy" style={{ fontSize: '0.66rem', padding: '1px 6px', marginTop: '4px' }}>
                      Stable
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, height: '40px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pressHistory}>
                        <defs>
                          <linearGradient id="pressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={['dataMin - 0.002', 'dataMax + 0.002']} />
                        <Area type="monotone" dataKey="press" stroke="#0d9488" strokeWidth={2} fill="url(#pressAreaGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Editor Modal */}
      <SensorEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        sensors={sensors}
        selectedSensorId={selectedSensorId}
        onSelectSensor={setSelectedSensorIdInternal}
        onRefreshAll={() => {
          api.getAlerts().then((res) => setAlerts(res.alerts)).catch(console.error);
        }}
      />
    </div>
  );
};

export default OverviewPage;
