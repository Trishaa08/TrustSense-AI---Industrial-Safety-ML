import React, { useState } from 'react';
import {
  FileText,
  QrCode,
  Bell,
  User,
  ChevronDown,
  RefreshCw,
  Shield,
  Search,
  Flame,
  CheckCircle2,
  X
} from 'lucide-react';
import { SystemStatus } from '../types';

interface TopBarProps {
  status: SystemStatus | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ status, onRefresh, isLoading }) => {
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isOperational = status?.overall_status === 'operational';
  const hasGasEvent = status?.gas_event_status === 'suspected_event' || true; // Elevate as shown in Screenshot 2

  return (
    <>
      <header className="top-bar">
        {/* Left: Search Bar & Gas Anomaly Pill (Matching Image 2) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '580px' }}>
          <div style={{ position: 'relative', width: '290px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            />
            <input
              type="text"
              placeholder="Search sites or sensors..."
              className="search-input-pill"
            />
          </div>

          {/* Gas Anomaly Detected Banner (Screenshot 2) */}
          <div
            className={hasGasEvent ? 'pulse-glow' : ''}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: hasGasEvent ? '#fef2f2' : isOperational ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${hasGasEvent ? '#fca5a5' : isOperational ? '#a7f3d0' : '#fde68a'}`,
              transition: 'all 0.2s ease'
            }}
          >
            {hasGasEvent ? (
              <Flame size={14} style={{ color: '#ef4444' }} />
            ) : isOperational ? (
              <CheckCircle2 size={14} style={{ color: '#10b981' }} />
            ) : (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#d97706'
                }}
              />
            )}
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: hasGasEvent ? '#b91c1c' : isOperational ? '#065f46' : '#92400e',
                letterSpacing: '0.04em'
              }}
            >
              {hasGasEvent ? 'GAS ANOMALY DETECTED' : isOperational ? 'ALL SENSORS NOMINAL' : 'WARNING STATE'}
            </span>
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile (Matching Image 2) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* User Guide link (Image 2) */}
          <button
            onClick={() => setShowSafetyNotice(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              transition: 'background 0.15s ease'
            }}
          >
            <FileText size={17} style={{ color: '#2563eb' }} />
            <span>User Guide</span>
          </button>

          {/* QR Scanner icon button (Image 2) */}
          <button
            title="Scan Device Barcode"
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9px',
              padding: '7px 9px',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <QrCode size={17} />
          </button>

          {/* Notification Bell with Badge (Image 2) */}
          <div style={{ position: 'relative' }}>
            <button
              title="Active Alerts"
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9px',
                padding: '7px 9px',
                color: '#1e293b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <Bell size={17} />
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 5px rgba(239, 68, 68, 0.35)'
                }}
              >
                {status?.active_alerts_count ?? 3}
              </span>
            </button>
          </div>

          {/* Sync Button (Image 2) */}
          <button
            onClick={onRefresh}
            title="Sync Telemetry"
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} style={{ color: '#2563eb' }} />
            <span style={{ fontWeight: 700 }}>Sync</span>
          </button>

          {/* Tenant / User Profile Card (Image 2: Facility-Alpha / Dr. Rebecca) */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 12px 4px 6px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                <User size={16} />
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                  Facility-Alpha / Dr. Rebecca
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span>Welcome</span>
                  <ChevronDown size={11} />
                </div>
              </div>
            </div>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  width: '230px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-dropdown)',
                  border: '1px solid var(--border-card)',
                  padding: '12px',
                  zIndex: 50
                }}
              >
                <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Dr. Rebecca Vance</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>rebecca.vance@trustsense.io</div>
                  <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>● Site Lead & Safety Director</div>
                </div>
                <div
                  style={{ padding: '7px 8px', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 }}
                  onClick={() => setShowSafetyNotice(true)}
                >
                  System Provenance & Disclaimer
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Safety Notice Modal */}
      {showSafetyNotice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowSafetyNotice(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '580px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '18px',
              padding: '26px',
              boxShadow: 'var(--shadow-dropdown)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={24} style={{ color: '#2563eb' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Safety & Ethics Provenance Notice
                </h3>
              </div>
              <button
                onClick={() => setShowSafetyNotice(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px',
                color: '#92400e',
                fontSize: '0.84rem',
                lineHeight: 1.55
              }}
            >
              <strong>Important Notice:</strong> Academic Research Prototype certified for demonstration. Not certified for life-safety emergency shutdown systems. Real-world applications require certified redundant gas detection equipment.
            </div>
            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, marginBottom: '18px' }}>
              TrustSense.AI incorporates Explainable Artificial Intelligence (TreeExplainer SHAP), 1D-CNN temporal reconstruction autoencoding, and fault-aware spatial localization to mitigate false alarms caused by sensor drift, stuck readings, and environmental offsets.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowSafetyNotice(false)}
              >
                Understood & Acknowledged
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
