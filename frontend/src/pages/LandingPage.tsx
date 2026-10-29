import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Play,
  Check,
  TrendingUp,
  Activity,
  Compass,
  Cpu,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Wifi,
  Radio,
  Eye,
  Lock
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchDashboard }) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f0f6fc 0%, #e8f1fc 40%, #edf4fd 100%)',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Decorative Atmospheric Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(37, 99, 235, 0.08) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 60%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Navigation Bar */}
      <nav
        style={{
          height: '76px',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={onLaunchDashboard}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.1 }}>
              TrustSense<span style={{ color: '#0284c7' }}>.AI</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              INDUSTRIAL SAFETY ML
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#0f172a' }}>
            <span>Product</span>
            <ChevronDown size={14} />
          </div>
          <a href="#how-it-works" style={{ textDecoration: 'none', color: '#334155', transition: 'color 0.15s ease' }}>How It Works</a>
          <a href="#safety-intelligence" style={{ textDecoration: 'none', color: '#334155', transition: 'color 0.15s ease' }}>Safety Intelligence</a>
          <a href="#about" style={{ textDecoration: 'none', color: '#334155', transition: 'color 0.15s ease' }}>About</a>
        </div>

        {/* Launch Dashboard Button */}
        <div>
          <button
            onClick={onLaunchDashboard}
            className="btn btn-primary"
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              fontSize: '0.92rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Launch Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          flex: 1,
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          padding: '60px 48px 40px',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          alignItems: 'center',
          gap: '40px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Left Hero Content */}
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Badge */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '9999px',
                background: 'rgba(219, 234, 254, 0.7)',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              <Sparkles size={14} style={{ color: '#0284c7' }} />
              SMARTER SENSORS. SAFER TOMORROW.
            </span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: '3.6rem',
              fontWeight: 800,
              lineHeight: 1.12,
              color: '#0a1128',
              letterSpacing: '-0.035em'
            }}
          >
            Sense the Invisible.
            <br />
            <span style={{ color: '#1d4ed8' }}>Protect What Matters.</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.2rem',
              lineHeight: 1.6,
              color: '#475569',
              maxWidth: '540px',
              fontWeight: 500
            }}
          >
            AI-powered gas anomaly detection and intelligent industrial safety monitoring — in real time.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
            <button
              onClick={onLaunchDashboard}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                borderRadius: '9999px',
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)'
              }}
            >
              <span>Explore Live Monitoring</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setVideoModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 24px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.96rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                transition: 'all 0.18s ease'
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Play size={12} style={{ marginLeft: '2px' }} />
              </div>
              <span>See How It Works</span>
            </button>
          </div>

          {/* Checkmark Bullets */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              color: '#475569',
              fontSize: '0.86rem',
              fontWeight: 600,
              marginTop: '12px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} style={{ color: '#2563eb' }} />
              Real-time sensor intelligence
            </span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} style={{ color: '#2563eb' }} />
              Explainable AI
            </span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} style={{ color: '#2563eb' }} />
              Fault-aware localization
            </span>
          </div>
        </div>

        {/* Right Hero Visual: Sensor Pod Orb with Floating Glass Cards (Matching Reference Image 1) */}
        <div
          className="animate-fade-in"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '480px'
          }}
        >
          {/* Glowing Energy Sphere & Particle Atmosphere */}
          <div
            className="floating-orb"
            style={{
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(224, 242, 254, 0.95) 0%, rgba(186, 230, 253, 0.5) 60%, rgba(37, 99, 235, 0.2) 100%)',
              border: '2px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 0 60px rgba(56, 189, 248, 0.4), inset 0 0 40px rgba(255, 255, 255, 0.9)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}
          >
            {/* Concentric Rotating Energy Rings */}
            <div
              style={{
                position: 'absolute',
                width: '420px',
                height: '420px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(2, 132, 199, 0.4)',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '390px',
                height: '390px',
                borderRadius: '50%',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                pointerEvents: 'none'
              }}
            />

            {/* Realistic 3D Dräger-Style Sensor Pod Centerpiece */}
            <div
              style={{
                width: '180px',
                height: '220px',
                borderRadius: '36px',
                background: 'linear-gradient(145deg, #ffffff 0%, #e2e8f0 70%, #cbd5e1 100%)',
                border: '3px solid #f8fafc',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25), inset 0 2px 4px rgba(255, 255, 255, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 12px',
                position: 'relative',
                zIndex: 5
              }}
            >
              {/* Top Sensor Gas Snorkel */}
              <div
                style={{
                  position: 'absolute',
                  top: '-18px',
                  width: '44px',
                  height: '20px',
                  borderRadius: '6px 6px 0 0',
                  background: 'linear-gradient(to right, #94a3b8, #cbd5e1, #64748b)',
                  border: '1px solid #475569'
                }}
              />

              {/* Status Ring / Sensor Core */}
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #0f172a 40%, #1e3a8a 100%)',
                  border: '4px solid #38bdf8',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.8), inset 0 0 15px rgba(2, 132, 199, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  marginTop: '10px'
                }}
              >
                <Wifi size={40} />
              </div>

              {/* Brand Label on Device */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  TrustSense.AI
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b' }}>
                  DRÄGER TS-X4
                </div>
              </div>

              {/* Bottom Gas Inflow Chamber */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-16px',
                  width: '50px',
                  height: '18px',
                  borderRadius: '0 0 8px 8px',
                  background: 'linear-gradient(to right, #64748b, #cbd5e1, #475569)',
                  border: '1px solid #334155'
                }}
              />
            </div>
          </div>

          {/* Floating Glassmorphic Card 1: NH3 DETECTED (Top Left) */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '-20px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 4px 10px rgba(2, 132, 199, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '180px',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
                NH₃ DETECTED
              </span>
              <span style={{ color: '#0284c7', fontSize: '0.75rem', fontWeight: 700 }}>&gt;</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>3.2</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>ppm</span>
            </div>
            {/* Sparkline curve */}
            <svg width="100%" height="24" viewBox="0 0 100 24" fill="none">
              <path
                d="M 0 18 Q 20 8, 40 16 T 80 8 T 100 4"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Floating Glassmorphic Card 2: SENSOR HEALTH (Top Right) */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: '-10px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 4px 10px rgba(16, 185, 129, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '180px',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
                  SENSOR HEALTH
                </span>
              </div>
              <span style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}>&gt;</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              98.4%
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '98.4%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>

          {/* Floating Glassmorphic Card 3: AI ANOMALY MODEL (Bottom Right) */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '-20px',
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 4px 10px rgba(37, 99, 235, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              minWidth: '220px',
              zIndex: 10
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cpu size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                AI ANOMALY MODEL
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>ACTIVE</span>
                {/* Heartbeat pulse waveform */}
                <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
                  <path d="M 0 7 L 10 7 L 14 1 L 18 13 L 22 5 L 26 9 L 30 7 L 40 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom 3 Feature Pillars (Matching Reference Image 1) */}
      <footer
        style={{
          borderTop: '1px solid rgba(226, 232, 240, 0.9)',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(10px)',
          padding: '30px 48px',
          zIndex: 10
        }}
      >
        <div
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px'
          }}
        >
          {/* Pillar 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Radio size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Real-time Intelligence
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Detect. Analyse. Respond.
              </div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid #e2e8f0', paddingLeft: '32px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#f0fdf4',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Cpu size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Explainable Risk Scoring
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Transparent. Trusted. Actionable.
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid #e2e8f0', paddingLeft: '32px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Compass size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Fault Localization
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Find the source. Minimize impact.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Video / Info Modal */}
      {videoModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px'
          }}
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: 'var(--shadow-dropdown)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              TrustSense.AI Industrial Architecture Overview
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              TrustSense combines high-frequency electrochemical & MOS sensor telemetry with 6 machine learning architectures (Random Forest, XGBoost, 1D-CNN Autoencoder, Isolation Forest, EWMA/CUSUM, and KNN) to distinguish genuine hazardous gas leaks from sensor drift, thermal shifts, and transient electrical noise.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setVideoModalOpen(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setVideoModalOpen(false);
                  onLaunchDashboard();
                }}
              >
                Open Overview Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

