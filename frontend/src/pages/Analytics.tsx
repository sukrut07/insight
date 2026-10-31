import React, { useEffect, useState } from 'react';
import { fetchAnalytics } from '../services/api';
import { AnalyticsData } from '../types';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const staticModel = data?.metrics?.static_model;
  const temporalModel = data?.metrics?.temporal_model;
  const classes = data?.metrics?.classes || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-brand-cyan" />
            <span>Actual Model Evaluation & Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real test set performance metrics computed strictly on held-out signer splits.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Untrained State or Performance Cards */}
      {!data?.is_model_trained ? (
        <div className="glass-panel p-8 rounded-2xl border border-amber-500/30 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Models Untrained</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No trained checkpoints found in models/gesture/. Please execute python ml/train_static.py and python ml/train_temporal.py.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Supported Signs
              </span>
              <div className="text-3xl font-extrabold text-white font-mono">
                {data.metrics.total_classes || 15}
              </div>
              <p className="text-[11px] text-brand-cyan">ISLRTC Verified Vocabulary</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Temporal LSTM Accuracy
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {temporalModel ? `${(temporalModel.accuracy * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-[11px] text-slate-400">
                F1-Score: {temporalModel ? temporalModel.f1_score.toFixed(2) : '--'}
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Inference Latency
              </span>
              <div className="text-3xl font-extrabold text-brand-cyan font-mono">
                {temporalModel ? `${temporalModel.inference_latency_ms.toFixed(1)}ms` : '--'}
              </div>
              <p className="text-[11px] text-slate-400">Per 30-frame sequence (MPS)</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                User Feedback Entries
              </span>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                {data.feedback.total_feedback_entries}
              </div>
              <p className="text-[11px] text-slate-400">Isolated calibration buffer</p>
            </div>
          </div>

          {/* Model Comparisons Table */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Classifier Evaluation Summary (Held-Out Test Split)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Architecture</th>
                    <th className="py-2.5 px-3">Test Samples</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Weighted Precision</th>
                    <th className="py-2.5 px-3">Weighted Recall</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {staticModel && (
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-3 text-slate-200 font-bold font-sans">
                        Random Forest (Static)
                      </td>
                      <td className="py-3 px-3 text-slate-300">{staticModel.test_samples}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">
                        {(staticModel.accuracy * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-slate-300">{staticModel.precision.toFixed(3)}</td>
                      <td className="py-3 px-3 text-slate-300">{staticModel.recall.toFixed(3)}</td>
                      <td className="py-3 px-3 text-brand-cyan">{staticModel.f1_score.toFixed(3)}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {staticModel.inference_latency_ms.toFixed(2)}ms
                      </td>
                    </tr>
                  )}
                  {temporalModel && (
                    <tr className="hover:bg-slate-900/50">
                      <td className="py-3 px-3 text-slate-200 font-bold font-sans">
                        Bidirectional LSTM (Temporal)
                      </td>
                      <td className="py-3 px-3 text-slate-300">{temporalModel.test_samples}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">
                        {(temporalModel.accuracy * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-slate-300">{temporalModel.precision.toFixed(3)}</td>
                      <td className="py-3 px-3 text-slate-300">{temporalModel.recall.toFixed(3)}</td>
                      <td className="py-3 px-3 text-brand-cyan">{temporalModel.f1_score.toFixed(3)}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {temporalModel.inference_latency_ms.toFixed(2)}ms
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrix Visualization */}
          {temporalModel?.confusion_matrix && classes.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Test Confusion Matrix ({temporalModel.model_type})
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Rows: True Labels • Columns: Predicted
                </span>
              </div>

              <div className="overflow-x-auto pb-2">
                <div
                  className="grid gap-1 min-w-[600px]"
                  style={{ gridTemplateColumns: `80px repeat(${classes.length}, minmax(36px, 1fr))` }}
                >
                  <div className="text-[10px] font-bold text-slate-500 self-center">True \ Pred</div>
                  {classes.map((cls, i) => (
                    <div key={i} className="text-[9px] font-mono text-slate-400 rotate-45 origin-left py-2">
                      {cls.slice(0, 4)}
                    </div>
                  ))}

                  {temporalModel.confusion_matrix.map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                      <div className="text-[10px] font-mono text-slate-400 self-center truncate">
                        {classes[rIdx]}
                      </div>
                      {row.map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        const intensity = Math.min(val / 25, 1.0);
                        return (
                          <div
                            key={cIdx}
                            className={`h-9 flex items-center justify-center text-[10px] font-mono rounded font-semibold transition-all ${
                              isDiag
                                ? 'bg-emerald-500/40 text-emerald-200 border border-emerald-500/50'
                                : val > 0
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-dark-900/60 text-slate-600'
                            }`}
                            title={`True: ${classes[rIdx]}, Pred: ${classes[cIdx]} => ${val} samples`}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
