import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  X
} from 'lucide-react';
import { DatasetInfo, DatasetPreview } from '../types';
import { api } from '../services/api';

export const DataManagementPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedFilename, setSelectedFilename] = useState<string>('sensor_windows.csv');
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const res = await api.getDatasets();
      setDatasets(res.datasets);
      if (res.datasets.length > 0) {
        loadPreview(res.datasets[0].filename);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPreview = async (filename: string) => {
    setIsLoading(true);
    setSelectedFilename(filename);
    try {
      const data = await api.getDatasetPreview(filename, 25);
      setPreview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadStatus('');
    setUploadError('');
    try {
      const res = await api.uploadDataset(uploadFile);
      setUploadStatus(`Uploaded and validated: ${res.filename} (${res.rows_parsed} rows).`);
      setUploadFile(null);
      await loadDatasets();
    } catch (err: any) {
      setUploadError(err.message || 'CSV validation or upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToDemo = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetToDemo();
      setResetMessage(res.message || 'Reset complete: Demo baseline restored safely.');
      setResetConfirmOpen(false);
      setTimeout(() => setResetMessage(''), 5000);
      await loadDatasets();
    } catch (err: any) {
      setResetMessage(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const downloadDataset = (fname: string) => {
    window.open(`/api/v1/reports/export/csv?filename=${encodeURIComponent(fname)}`, '_blank');
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
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Database size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Dataset Repository & SQLite Persistence Management
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              Original demo dataset (23,040 rows, 2,880 timesteps across 8 units) remains immutable. User changes persist in SQLite.
            </div>
          </div>
        </div>

        {/* Reset to Demo Baseline Button */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', borderColor: '#fca5a5' }}
          onClick={() => setResetConfirmOpen(true)}
        >
          <RotateCcw size={14} />
          Reset to Demo Baseline
        </button>
      </div>

      {resetMessage && (
        <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', padding: '10px 16px', borderRadius: '8px', fontSize: '0.84rem', color: '#065f46', fontWeight: 700 }}>
          ✓ {resetMessage}
        </div>
      )}

      {/* Main Grid: Dataset Cards List + Upload Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        {/* Dataset Inventory Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Available Dataset Artifacts
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Source: Immutable Local Repository
            </span>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Row Count</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr
                    key={d.filename}
                    onClick={() => loadPreview(d.filename)}
                    style={{
                      background: selectedFilename === d.filename ? '#eff6ff' : undefined,
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileSpreadsheet size={16} style={{ color: '#2563eb' }} />
                        {d.filename}
                      </div>
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: '#334155' }}>
                      {(d.row_count ?? 0).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{d.size_kb} KB</td>
                    <td>
                      <span className={`badge ${d.role === 'benchmark' || d.role === 'synthetic' ? 'badge-info' : 'badge-healthy'}`}>
                        {d.role || 'Demo Source'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDataset(d.filename);
                        }}
                        title="Download CSV"
                      >
                        <Download size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Custom CSV Form */}
        <div className="card">
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Upload Validated Sensor Timeseries (CSV)
          </div>
          <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
            Uploaded files are isolated into the user partition without altering default benchmarks. Required schema includes timestamp, unit_id, and raw sensory channels.
          </p>

          <form onSubmit={handleUpload}>
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                background: '#f8fafc',
                marginBottom: '14px',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <Upload size={28} style={{ color: '#2563eb', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                {uploadFile ? uploadFile.name : 'Click to select CSV file'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Max file size: 50MB. Format: UTF-8 CSV
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {uploadStatus && (
              <div style={{ background: '#d1fae5', color: '#065f46', padding: '8px 12px', borderRadius: '6px', fontSize: '0.76rem', marginBottom: '12px', fontWeight: 600 }}>
                ✓ {uploadStatus}
              </div>
            )}

            {uploadError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '6px', fontSize: '0.76rem', marginBottom: '12px', fontWeight: 600 }}>
                ✕ {uploadError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.82rem', fontWeight: 700 }}
              disabled={!uploadFile || isUploading}
            >
              {isUploading ? 'Validating & Uploading...' : 'Upload & Validate Dataset'}
            </button>
          </form>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Dataset Head Preview: <code>{selectedFilename}</code>
            </h3>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
              Showing first 25 observations across 17 feature channels
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            onClick={() => downloadDataset(selectedFilename)}
          >
            <Download size={14} style={{ color: '#2563eb' }} />
            Download File
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            Loading dataset preview...
          </div>
        ) : preview ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {preview.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, rIdx) => (
                  <tr key={rIdx}>
                    {preview.columns.map((c) => (
                      <td key={c} className="mono" style={{ fontSize: '0.76rem' }}>
                        {r[c] !== undefined && r[c] !== null ? String(r[c]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', color: '#64748b' }}>No preview available.</div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
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
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: 'var(--shadow-dropdown)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <AlertTriangle size={24} style={{ color: '#dc2626' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Confirm Reset to Demo Data
              </h3>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '18px' }}>
              This will clear all simulated sensor modifications, injected faults, and temporary alert records in SQLite, restoring the initial research baseline. Original CSV source files and model weights remain completely untouched.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setResetConfirmOpen(false)}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleResetToDemo}
                disabled={isResetting}
                style={{ fontWeight: 700 }}
              >
                {isResetting ? 'Resetting...' : 'Yes, Restore Demo Baseline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementPage;
