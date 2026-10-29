import React from 'react';
import {
  Home,
  Map,
  ShieldCheck,
  Activity,
  Compass,
  Cpu,
  Bell,
  Database,
  Settings,
  ShieldAlert,
  PlayCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  activeAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeAlertCount = 0
}) => {
  const groups = [
    {
      title: 'CORE SITES',
      items: [
        { id: 'overview', label: 'Overview Dashboard', icon: Home },
        { id: 'leak-map', label: 'Facility Map & Sites', icon: Map }
      ]
    },
    {
      title: 'SENSOR TELEMETRY',
      items: [
        { id: 'sensor-health', label: 'Sensor Status & Health', icon: ShieldCheck },
        { id: 'playback', label: 'Live Playback Simulator', icon: PlayCircle }
      ]
    },
    {
      title: 'AI LAB & DIAGNOSTICS',
      items: [
        { id: 'model-performance', label: 'Model Lab (6 Models)', icon: Cpu },
        { id: 'fault-diagnostics', label: 'Fault Diagnostics & SHAP', icon: Activity },
        { id: 'leak-investigation', label: 'Leak Centroid & Error', icon: Compass }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'alerts', label: 'Alerts & History', icon: Bell, badge: activeAlertCount },
        { id: 'data-management', label: 'Data Management', icon: Database },
        { id: 'settings', label: 'Settings & Security', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '20px 22px 18px', borderBottom: '1px solid var(--border-subtle)', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onNavigate('overview')}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)'
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.16rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#0f172a', lineHeight: 1.15 }}>
              TrustSense<span style={{ color: '#0284c7' }}>.AI</span>
            </div>
            <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              INDUSTRIAL SAFETY ML
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {/* Quick Portal Switcher */}
        <div style={{ padding: '0 12px 10px' }}>
          <button
            onClick={() => onNavigate(currentPage === 'landing' ? 'overview' : 'landing')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: currentPage === 'landing' ? '#eff6ff' : '#f8fafc',
              border: currentPage === 'landing' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              color: currentPage === 'landing' ? '#1d4ed8' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Sparkles size={15} style={{ color: '#0284c7' }} />
              {currentPage === 'landing' ? 'Back to Dashboard' : 'Public Hero Portal'}
            </span>
            <ChevronRight size={13} style={{ opacity: 0.7 }} />
          </button>
        </div>

        {groups.map((grp, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '14px' }}>
            <div className="nav-section-title">{grp.title}</div>
            {grp.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <div
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={18} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        background: isActive ? '#ef4444' : '#fee2e2',
                        color: isActive ? '#ffffff' : '#b91c1c',
                        padding: '1px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={15} style={{ opacity: 0.9 }} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Safety Protocol Badge (Matching Image 2) */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#334155' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
            }}
          />
          <span style={{ fontWeight: 600 }}>Safety Protocol:</span>
          <span style={{ fontWeight: 800, color: '#059669' }}>ACTIVE (v2.4)</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.35 }}>
          Academic Research Prototype. Certified for simulated demonstration.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
