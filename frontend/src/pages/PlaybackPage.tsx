import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Gauge,
  AlertTriangle,
  Clock,
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { SensorPosition, SimulationInfo, SimulationStepData } from '../types';
import { api } from '../services/api';
import { FloorplanMap } from '../components/FloorplanMap';
import { SensorEditorModal } from '../components/SensorEditorModal';

interface PlaybackPageProps {
  sensors: SensorPosition[];
  onSelectSensor: (sensorId: string) => void;
}

export const PlaybackPage: React.FC<PlaybackPageProps> = ({ sensors, onSelectSensor }) => {
  const [simInfo, setSimInfo] = useState<SimulationInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [stepData, setStepData] = useState<SimulationStepData | null>(null);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('S03');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    api.getSimulationInfo()
      .then((info) => {
        setSimInfo(info);
        fetchStep(info.current_step || 0);
      })
      .catch(console.error);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchStep = async (stepIndex: number) => {
    try {
      const data = await api.getSimulationStep(stepIndex);
      setStepData(data);
      setCurrentStep(stepIndex);
    } catch (err) {
      console.error('Failed to fetch step data:', err);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, 1000 / speed);
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const next = prev + 1;
          if (simInfo && next >= simInfo.total_steps) {
            setIsPlaying(false);
            return prev;
          }
          fetchStep(next);
          return next;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, simInfo]);

  const handleSeek = (newStep: number) => {
    setCurrentStep(newStep);
    fetchStep(newStep);
  };

  // Map sensor list with updated dynamic readings from stepData
  const dynamicSensors: SensorPosition[] = sensors.map((s) => {
    if (!stepData) return s;
    const reading = stepData.sensor_readings[s.sensor_id] ?? s.current_reading;
    const trust = stepData.sensor_trust_scores[s.sensor_id] ?? s.trust_score;
    const fault = stepData.fault_injections[s.sensor_id] ?? s.suspected_fault;
    const isFaulty = trust < 60 || fault !== 'none';
    const isWarning = trust >= 60 && trust < 80;

    return {
      ...s,
      current_reading: reading,
      trust_score: trust,
      suspected_fault: fault,
      health_status: isFaulty ? 'suspected_faulty' : isWarning ? 'warning' : 'healthy'
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Simulation Notice Banner */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: '#92400e', lineHeight: 1.5 }}>
            <strong>Playback Simulation Mode:</strong> Stepping through preloaded 48-hour time series (2,880 timesteps across 8 hardware units). You can pause playback and edit readings or inject faults interactively.
          </div>
        </div>

        <button
          className="btn btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700 }}
          onClick={() => {
            setIsPlaying(false);
            setEditorOpen(true);
          }}
        >
          <Sliders size={14} style={{ color: '#2563eb' }} />
          Pause & Edit Reading
        </button>
      </div>

      {/* Playback Controls Card */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          {/* Status info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Simulation Timestamp</div>
                <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {stepData?.timestamp || simInfo?.time_start || '2025-02-01 00:00:00'}
                </div>
              </div>
            </div>

            <div style={{ height: '36px', width: '1px', background: '#cbd5e1' }} />

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Step Progress</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
                {currentStep + 1} / {simInfo?.total_steps ?? 2880}
              </div>
            </div>

            {stepData?.active_gas_event && (
              <span className="badge badge-faulty" style={{ animation: 'pulse 1.5s infinite' }}>
                ● GAS RELEASE DETECTED IN TIMESTEP
              </span>
            )}
          </div>

          {/* Buttons: Back, Play/Pause, Next, Reset, Speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={() => handleSeek(Math.max(0, currentStep - 10))}
              title="Step backward 10 steps"
            >
              <SkipBack size={16} />
            </button>

            <button
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
              style={{ padding: '8px 24px', fontSize: '0.9rem', fontWeight: 700 }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'Pause Playback' : 'Start Playback'}
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={() => handleSeek(Math.min((simInfo?.total_steps ?? 2880) - 1, currentStep + 10))}
              title="Step forward 10 steps"
            >
              <SkipForward size={16} />
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={() => handleSeek(0)}
              title="Reset to beginning"
            >
              <RotateCcw size={16} />
            </button>

            {/* Playback speed selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <Gauge size={16} style={{ color: '#2563eb' }} />
              <select
                className="input-control"
                style={{ padding: '6px 10px', fontSize: '0.82rem', fontWeight: 700 }}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
              >
                <option value={0.5}>0.5x Speed</option>
                <option value={1.0}>1.0x Realtime</option>
                <option value={2.0}>2.0x Fast</option>
                <option value={5.0}>5.0x Turbo</option>
                <option value={10.0}>10.0x Warp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrubbing Range Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="range"
            min={0}
            max={(simInfo?.total_steps ?? 2880) - 1}
            value={currentStep}
            onChange={(e) => handleSeek(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #1e3a8a 0%, #0284c7 100%)',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
            <span>{simInfo?.time_start || 'Day 1 00:00:00'}</span>
            <span>48 Hours Duration (2,880 Observations @ 60s Resolution)</span>
            <span>{simInfo?.time_end || 'Day 2 23:59:00'}</span>
          </div>
        </div>
      </div>

      {/* Synchronized Floorplan + Reading Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Floorplan Map */}
        <FloorplanMap
          sensors={dynamicSensors}
          onSelectSensor={(id) => {
            setSelectedSensorId(id);
            onSelectSensor(id);
          }}
          localization={stepData?.localization || null}
          height={480}
        />

        {/* Current Timestep Sensor Readings Stream */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#2563eb' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Synchronized Sensor Telemetry
              </h3>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              Timestep #{currentStep + 1}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              overflowY: 'auto',
              maxHeight: '410px',
              paddingRight: '4px'
            }}
          >
            {dynamicSensors.map((s) => {
              const fault = s.suspected_fault;
              const hasFault = fault !== 'none';
              return (
                <div
                  key={s.sensor_id}
                  onClick={() => {
                    setSelectedSensorId(s.sensor_id);
                    onSelectSensor(s.sensor_id);
                  }}
                  style={{
                    background: hasFault ? '#fef2f2' : '#ffffff',
                    border: `1px solid ${hasFault ? '#fca5a5' : '#e2e8f0'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>
                      {s.sensor_id}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: s.trust_score >= 80 ? '#059669' : s.trust_score >= 60 ? '#d97706' : '#dc2626'
                      }}
                    >
                      Trust: {s.trust_score.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      {s.current_reading.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ppm eq</span>
                  </div>
                  {hasFault && (
                    <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '4px', fontWeight: 700 }}>
                      ⚠ Injected: {fault}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sensor Editor Modal */}
      <SensorEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        sensors={sensors}
        selectedSensorId={selectedSensorId}
        onSelectSensor={setSelectedSensorId}
        onRefreshAll={() => {
          fetchStep(currentStep);
        }}
      />
    </div>
  );
};

export default PlaybackPage;
