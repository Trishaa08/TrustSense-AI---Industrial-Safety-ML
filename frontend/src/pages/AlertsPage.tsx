import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Download,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  Info,
  X,
  Sliders,
  ChevronDown,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { AlertItem, SensorPosition } from '../types';
import { api } from '../services/api';

interface AlertsPageProps {
  sensors: SensorPosition[];
  onSelectSensor: (sensorId: string) => void;
  onNavigate: (page: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  sensors,
  onSelectSensor,
  onNavigate
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [ackModalOpen, setAckModalOpen] = useState<boolean>(false);
  const [analystName, setAnalystName] = useState<string>('Dr. Rebecca (Safety Lead)');
  const [newStatus, setNewStatus] = useState<string>('acknowledged');
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await api.getAlerts();
      setAlerts(res.alerts);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sensor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setIsUpdating(true);
    try {
      await api.acknowledgeAlert(selectedAlert.id, {
        status: newStatus,
        analyst_name: analystName,
        notes: analystNotes
      });
      setAckModalOpen(false);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const exportAlertsCSV = () => {
    window.open('/api/v1/alerts/export/csv', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Title & Action Bar (Screenshot 4) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Alerts
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#475569', margin: '4px 0 0' }}>
            Central notification feed of ML-classified gas events and physical sensor anomalies.
          </p>
        </div>

        {/* Screenshot 4 Emerald Green "+ Export To Excel" Pill Button */}
        <button
          onClick={exportAlertsCSV}
          className="btn-emerald"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={16} />
          Export To Excel
        </button>
      </div>

      {/* Filter and Search Bar (Screenshot 4) */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
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
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-pill"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Severity:</span>
            <select
              className="input-control"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Status:</span>
            <select
              className="input-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New (Active)</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved / Closed</option>
            </select>
          </div>

          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            Showing <strong>{filteredAlerts.length}</strong> alerts
          </span>
        </div>
      </div>

      {/* Main Alerts Table (Screenshot 4) */}
      <div className="card" style={{ padding: '0', overflow: 'visible' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert Number</th>
                <th>Device Id</th>
                <th>Property</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Creation Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => {
                const isCrit = alert.severity === 'critical';
                const isWarn = alert.severity === 'warning';
                return (
                  <tr key={alert.id} style={{ position: 'relative' }}>
                    {/* Alert Number with Bell icon (Screenshot 4) */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: isCrit ? '#fee2e2' : isWarn ? '#fef3c7' : '#ecfdf5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCrit ? '#dc2626' : isWarn ? '#d97706' : '#059669'
                          }}
                        >
                          <Bell size={14} />
                        </div>
                        <span className="mono" style={{ fontWeight: 800, color: '#0f172a' }}>
                          {alert.id}
                        </span>
                      </div>
                    </td>

                    {/* Device Id (Screenshot 4) */}
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#2563eb',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          onSelectSensor(alert.sensor_id);
                          onNavigate('fault-diagnostics');
                        }}
                        title="View sensor diagnostics"
                      >
                        Unit {alert.sensor_id}
                      </span>
                    </td>

                    {/* Property / Title (Screenshot 4) */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{alert.title}</div>
                      <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                        {alert.description.length > 60 ? `${alert.description.slice(0, 60)}...` : alert.description}
                      </div>
                    </td>

                    {/* Severity with circular indicator (Screenshot 4) */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: isCrit ? '#dc2626' : isWarn ? '#f59e0b' : '#059669',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          i
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                          {alert.severity}
                        </span>
                      </div>
                    </td>

                    {/* Status Pill (Screenshot 4) */}
                    <td>
                      <span
                        className={`badge ${
                          alert.status === 'acknowledged'
                            ? 'badge-acknowledged'
                            : alert.status === 'resolved'
                            ? 'badge-closed'
                            : 'badge-active'
                        }`}
                      >
                        {alert.status === 'new' ? 'Active' : alert.status}
                      </span>
                    </td>

                    {/* Creation Time (Screenshot 4) */}
                    <td className="mono" style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                      {alert.timestamp}
                    </td>

                    {/* Action 3-Dots Menu & Troubleshoot (Screenshot 4 & 2) */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                        <button
                          className="btn-troubleshoot"
                          style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                          onClick={() => {
                            onSelectSensor(alert.sensor_id);
                            onNavigate('fault-diagnostics');
                          }}
                        >
                          Troubleshoot
                        </button>

                        <button
                          onClick={() => setActiveMenuId(activeMenuId === alert.id ? null : alert.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#475569',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Three-dots popup menu (Screenshot 4: Invoke / Edit) */}
                        {activeMenuId === alert.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '28px',
                              width: '140px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              boxShadow: 'var(--shadow-dropdown)',
                              zIndex: 60,
                              padding: '6px',
                              textAlign: 'left'
                            }}
                          >
                            <div
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                color: '#0f172a',
                                fontWeight: 600,
                                cursor: 'pointer',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onClick={() => {
                                onSelectSensor(alert.sensor_id);
                                onNavigate('fault-diagnostics');
                                setActiveMenuId(null);
                              }}
                            >
                              <Wrench size={13} style={{ color: '#2563eb' }} />
                              Invoke / Inspect
                            </div>
                            <div
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                color: '#0f172a',
                                fontWeight: 600,
                                cursor: 'pointer',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onClick={() => {
                                setSelectedAlert(alert);
                                setNewStatus(alert.status);
                                setAnalystNotes(alert.analyst_notes || '');
                                setAckModalOpen(true);
                                setActiveMenuId(null);
                              }}
                            >
                              <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                              Acknowledge / Edit
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Action Modal */}
      {ackModalOpen && selectedAlert && (
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
          onClick={() => setAckModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: 'var(--shadow-dropdown)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={22} style={{ color: '#2563eb' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Audit & Acknowledge Alert {selectedAlert.id}
                </h3>
              </div>
              <button
                onClick={() => setAckModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Alert Title & Description:
                </label>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', color: '#334155' }}>
                  <strong>{selectedAlert.title}</strong>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>{selectedAlert.description}</div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Update Status:
                </label>
                <select
                  className="input-control"
                  style={{ width: '100%' }}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="new">Active (New Unreviewed)</option>
                  <option value="acknowledged">Acknowledged (Under Review)</option>
                  <option value="investigating">Investigating (Field Crew Dispatched)</option>
                  <option value="resolved">Resolved (Inspection Verified)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Safety Analyst Signature:
                </label>
                <input
                  type="text"
                  className="input-control"
                  style={{ width: '100%' }}
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Analyst Findings & Action Notes:
                </label>
                <textarea
                  className="input-control"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Record physical inspection results, bump test outcome, or justification..."
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAckModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving Audit Entry...' : 'Save Audit Signature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
