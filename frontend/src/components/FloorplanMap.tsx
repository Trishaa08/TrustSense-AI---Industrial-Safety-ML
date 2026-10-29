import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Eye,
  EyeOff,
  Crosshair,
  AlertOctagon,
  ZoomIn,
  ZoomOut,
  Compass,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SensorPosition, LocalizationResult } from '../types';

interface FloorplanMapProps {
  sensors: SensorPosition[];
  selectedSensorId?: string;
  onSelectSensor?: (sensorId: string) => void;
  localization?: LocalizationResult | null;
  height?: number | string;
  showHeatmapDefault?: boolean;
}

export const FloorplanMap: React.FC<FloorplanMapProps> = ({
  sensors,
  selectedSensorId,
  onSelectSensor,
  localization,
  height = 460,
  showHeatmapDefault = true
}) => {
  const [showHeatmap, setShowHeatmap] = useState(showHeatmapDefault);
  const [showUncertainty, setShowUncertainty] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapFilter, setMapFilter] = useState<'all' | 'critical'>('all');

  // Layout coordinate bounds: local X from 0 to 45m, Y from 0 to 30m
  const maxX = 45;
  const maxY = 30;

  const getPercentX = (x_m: number) => ((x_m / maxX) * 100).toFixed(2);
  const getPercentY = (y_m: number) => (((maxY - y_m) / maxY) * 100).toFixed(2);

  // Zones definition in synthetic facility
  const zones = [
    { name: 'Zone A (Chemical Storage)', x: '3%', y: '5%', w: '44%', h: '42%', color: 'rgba(37, 99, 235, 0.04)', border: '#bfdbfe' },
    { name: 'Zone B (Reaction Vessels)', x: '51%', y: '5%', w: '45%', h: '42%', color: 'rgba(239, 68, 68, 0.04)', border: '#fecaca' },
    { name: 'Zone C (Ventilation Bay)', x: '3%', y: '52%', w: '44%', h: '42%', color: 'rgba(16, 185, 129, 0.04)', border: '#bbf7d0' },
    { name: 'Zone D (Loading Bay)', x: '51%', y: '52%', w: '45%', h: '42%', color: 'rgba(168, 85, 247, 0.04)', border: '#e9d5ff' }
  ];

  const displayedSensors = mapFilter === 'critical'
    ? sensors.filter((s) => s.health_status !== 'healthy' || s.current_reading > 20)
    : sensors;

  return (
    <div className="card" style={{ padding: '16px', position: 'relative' }}>
      {/* Controls & Layer Header (Screenshot 2 style) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crosshair size={18} style={{ color: '#2563eb' }} />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Facility Spatial Floorplan
            </span>
          </div>

          {/* Screenshot 2 Filter Toggles: Critical Alerts vs All Alerts */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '9999px', border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setMapFilter('critical')}
              style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: mapFilter === 'critical' ? '#ffffff' : 'transparent',
                color: mapFilter === 'critical' ? '#dc2626' : '#64748b',
                boxShadow: mapFilter === 'critical' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              📍 Critical Alerts
            </button>
            <button
              onClick={() => setMapFilter('all')}
              style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: mapFilter === 'all' ? '#ffffff' : 'transparent',
                color: mapFilter === 'all' ? '#0f172a' : '#64748b',
                boxShadow: mapFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              📍 All Sensors
            </button>
          </div>
        </div>

        {/* Layer Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            <Layers size={13} />
            Gas Plume Heatmap
          </button>
          <button
            className={`btn ${showUncertainty ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            onClick={() => setShowUncertainty(!showUncertainty)}
          >
            Uncertainty Ellipse
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? <Eye size={13} /> : <EyeOff size={13} />}
            Labels
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px' }}
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px' }}
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div
        className="floorplan-wrapper"
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          background: '#f8fafc',
          border: '1px solid #cbd5e1'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease'
          }}
        >
          {/* Architectural floorplan grid */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              opacity: 0.35
            }}
          >
            <defs>
              <pattern id="facility-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#cbd5e1" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#facility-grid)" />
          </svg>

          {/* Zones Outline with CRISP DARK TEXT */}
          {zones.map((z, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: z.x,
                top: z.y,
                width: z.w,
                height: z.h,
                border: `1.5px dashed ${z.border}`,
                background: z.color,
                borderRadius: '8px',
                pointerEvents: 'none'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#334155',
                  letterSpacing: '0.04em'
                }}
              >
                {z.name}
              </span>
            </div>
          ))}

          {/* Simulated Gas Concentration Heatmap Gradient Layer */}
          {showHeatmap && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden'
              }}
            >
              {sensors
                .filter((s) => s.current_reading > 15)
                .map((s) => {
                  const intensity = Math.min(1, (s.current_reading - 15) / 45);
                  const radius = 60 + intensity * 120;
                  return (
                    <div
                      key={`heat-${s.sensor_id}`}
                      style={{
                        position: 'absolute',
                        left: `${getPercentX(s.x_m)}%`,
                        top: `${getPercentY(s.y_m)}%`,
                        width: `${radius * 2}px`,
                        height: `${radius * 2}px`,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(239, 68, 68, ${0.45 * intensity}) 0%, rgba(245, 158, 11, ${0.3 * intensity}) 40%, rgba(37, 99, 235, ${0.15 * intensity}) 70%, transparent 100%)`,
                        filter: 'blur(16px)',
                        transition: 'all 0.5s ease'
                      }}
                    />
                  );
                })}
            </div>
          )}

          {/* Candidate Leak Source Pin & Uncertainty Region */}
          {localization && localization.estimated_x_m !== null && localization.estimated_y_m !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${getPercentX(localization.estimated_x_m)}%`,
                top: `${getPercentY(localization.estimated_y_m)}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 25
              }}
            >
              {/* Shaded Uncertainty Error Radius */}
              {showUncertainty && localization.uncertainty_radius_m && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${((localization.uncertainty_radius_m * 2) / maxX) * 100 * 5}px`,
                    height: `${((localization.uncertainty_radius_m * 2) / maxY) * 100 * 3.5}px`,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '2px dashed #ef4444',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Pulsing Radar Circle */}
              <div
                className="pulse-circle"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.4)',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Center Leak Icon Pin */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#dc2626',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.45)',
                  border: '3px solid #ffffff',
                  cursor: 'pointer'
                }}
                title={`Candidate Gas Leak Source (${localization.estimated_x_m.toFixed(1)}m, ${localization.estimated_y_m.toFixed(1)}m)`}
              >
                <Compass size={18} />
              </div>

              {/* Label */}
              <div
                style={{
                  position: 'absolute',
                  top: '36px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                Estimated Source ({localization.confidence_score.toFixed(0)}% Conf)
              </div>
            </div>
          )}

          {/* Sensor Markers (Screenshot 2: Red pins = Critical Alert, Dark Slate = Normal) */}
          {displayedSensors.map((s) => {
            const isSelected = s.sensor_id === selectedSensorId;
            const isCritical = s.health_status !== 'healthy' || s.current_reading > 20;

            return (
              <div
                key={s.sensor_id}
                style={{
                  position: 'absolute',
                  left: `${getPercentX(s.x_m)}%`,
                  top: `${getPercentY(s.y_m)}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 30 : 20,
                  cursor: 'pointer'
                }}
                onClick={() => onSelectSensor && onSelectSensor(s.sensor_id)}
              >
                {/* Location Marker Pin (Screenshot 2 style) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50% 50% 50% 0',
                      transform: 'rotate(-45deg)',
                      background: isCritical ? '#dc2626' : '#1e293b',
                      border: isSelected ? '3px solid #2563eb' : '2px solid #ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        transform: 'rotate(45deg)'
                      }}
                    />
                  </div>

                  {showLabels && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        marginTop: '2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.sensor_id}: {s.current_reading.toFixed(1)} ppm
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Legend (Screenshot 2) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.74rem',
          color: '#475569',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1e293b' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1e293b' }} />
            Normal Sensor (Slate Pin)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#dc2626' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#dc2626' }} />
            Critical Alert / High Gas (Red Pin)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0d9488' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0d9488' }} />
            Gas Plume Dispersion
          </span>
        </div>

        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
          Spatial Coordinates: 0.0m – 45.0m (East-West), 0.0m – 30.0m (North-South)
        </div>
      </div>
    </div>
  );
};

export default FloorplanMap;
