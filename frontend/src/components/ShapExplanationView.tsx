import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  AlertCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { ShapExplanation, ShapFeatureContribution } from '../types';
import { api } from '../services/api';

interface ShapExplanationViewProps {
  sensorId: string;
  defaultModelId?: string;
  refreshKey?: number;
}

export const ShapExplanationView: React.FC<ShapExplanationViewProps> = ({
  sensorId,
  defaultModelId = 'model_1_random_forest',
  refreshKey = 0
}) => {
  const [modelId, setModelId] = useState<string>(defaultModelId);
  const [targetClass, setTargetClass] = useState<string>('drift');
  const [shapData, setShapData] = useState<ShapExplanation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSensorShap(
        sensorId,
        modelId,
        modelId === 'model_2_xgboost_fault' ? targetClass : undefined
      );
      setShapData(data);
    } catch (err: any) {
      console.error('Failed to fetch SHAP explanation:', err);
      setError(err.message || 'SHAP computation failed for this model.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShap();
  }, [sensorId, modelId, targetClass, refreshKey]);

  // Format data for horizontal waterfall / contribution bar chart
  const contributions: any[] = shapData?.feature_contributions || (shapData as any)?.ranked_contributions || [];
  const chartData = contributions.slice(0, 10).map((f: any) => ({
    name: f.feature,
    shapValue: Number((f.shap_value ?? 0).toFixed(4)),
    actualValue: typeof f.value === 'number' ? f.value.toFixed(2) : String(f.value ?? ''),
    direction: f.contribution_direction || f.direction || 'neutral',
    description: f.description || ''
  }));

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#f0fdfa',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={16} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              SHAP Attribution & Local Explanations
            </h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 36px' }}>
            Additive feature attributions for <strong>{sensorId}</strong> computed via real{' '}
            <code>TreeExplainer</code>.
          </p>
        </div>

        {/* Model & Class Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="input-control"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '5px 10px' }}
          >
            <option value="model_1_random_forest">Model 1: Random Forest (Healthy vs Faulty)</option>
            <option value="model_2_xgboost_fault">Model 2: XGBoost (Fault Diagnosis)</option>
          </select>

          {modelId === 'model_2_xgboost_fault' && (
            <select
              className="input-control"
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '5px 10px' }}
            >
              <option value="drift">Class: Drift</option>
              <option value="offset">Class: Offset</option>
              <option value="stuck">Class: Stuck</option>
              <option value="noise_increase">Class: Noise Increase</option>
              <option value="slow_response">Class: Slow Response</option>
              <option value="sensitivity_loss">Class: Sensitivity Loss</option>
              <option value="none">Class: None (Healthy)</option>
            </select>
          )}

          <button
            className="btn btn-secondary"
            onClick={fetchShap}
            disabled={isLoading}
            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
            title="Recompute SHAP values"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 8px', color: '#0d9488' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Calculating genuine TreeExplainer Shapley values...</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
            Sampling reference background & computing exact feature marginal contributions
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#dc2626',
            fontSize: '0.84rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && shapData && (
        <div>
          {/* Explanation Banner */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
                Prediction Attribution ({shapData.output_scale || 'Probability'}):
              </span>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                Base Value E[f(x)]: <code className="mono">{(shapData.base_value ?? 0.5).toFixed(3)}</code> → Model Output f(x):{' '}
                <code
                  className="mono"
                  style={{
                    color:
                      Number(
                        shapData.prediction_value ??
                          (shapData as any).predicted_probability ??
                          (shapData as any).target_class_probability ??
                          0
                      ) > 0.5
                        ? '#dc2626'
                        : '#059669'
                  }}
                >
                  {Number(
                    shapData.prediction_value ??
                      (shapData as any).predicted_probability ??
                      (shapData as any).target_class_probability ??
                      0
                  ).toFixed(3)}
                </code>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Target Dimension:</span>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0d9488' }}>
                {shapData.target_class || 'Fault Risk'}
              </div>
            </div>
          </div>

          {/* Research Summary Quote */}
          <div
            style={{
              background: '#f0fdfa',
              borderLeft: '4px solid #0d9488',
              padding: '10px 14px',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.82rem',
              color: '#0f766e',
              lineHeight: 1.5,
              marginBottom: '18px'
            }}
          >
            <strong>Plain-English Research Interpretation:</strong>{' '}
            {shapData.plain_english_summary || (shapData as any).summary || 'TreeExplainer attribution generated for current sensor features.'}
          </div>

          {/* Waterfall / Contribution Bar Chart */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Top Local Feature Contributions (Signed SHAP Values)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                Red / Amber = Increases Fault Risk (+) | Green / Teal = Supports Normal Health (-)
              </span>
            </div>

            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.08)',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                            <div>
                              Input Value: <strong>{d.actualValue}</strong>
                            </div>
                            <div>
                              SHAP Impact: <strong>{d.shapValue > 0 ? `+${d.shapValue}` : d.shapValue}</strong>
                            </div>
                            <div style={{ color: '#64748b', marginTop: '4px' }}>{d.description}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                  <Bar dataKey="shapValue" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.shapValue > 0 ? '#ef4444' : '#0d9488'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranked Feature Contributions Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Feature</th>
                  <th>Observation Value</th>
                  <th>SHAP Contribution</th>
                  <th>Direction</th>
                  <th>Research Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((fc: any, idx: number) => {
                  const valNum = typeof fc.value === 'number' ? fc.value.toFixed(2) : String(fc.value ?? '—');
                  const shapVal = fc.shap_value ?? 0;
                  const isPos = shapVal > 0;
                  return (
                    <tr key={fc.feature || idx}>
                      <td style={{ fontWeight: 700, color: '#64748b' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <code>{fc.feature}</code>
                      </td>
                      <td className="mono">{valNum}</td>
                      <td className="mono" style={{ fontWeight: 700, color: isPos ? '#dc2626' : '#059669' }}>
                        {isPos ? `+${shapVal.toFixed(4)}` : shapVal.toFixed(4)}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: isPos ? '#fee2e2' : '#f0fdfa',
                            color: isPos ? '#dc2626' : '#0d9488'
                          }}
                        >
                          {isPos ? (
                            <>
                              <TrendingUp size={12} /> Positive
                            </>
                          ) : (
                            <>
                              <TrendingDown size={12} /> Negative
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fc.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Academic Transparency Note */}
          <div
            style={{
              marginTop: '14px',
              padding: '10px 12px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#64748b'
            }}
          >
            <strong>SHAP Computational Method:</strong> Explanations calculated using <code>shap.TreeExplainer</code> with interventional background conditioning. Values represent exact local Shapley attributions $\phi_i(x)$ satisfying efficiency $\sum \phi_i = f(x) - E[f(x)]$.
          </div>
        </div>
      )}
    </div>
  );
};
