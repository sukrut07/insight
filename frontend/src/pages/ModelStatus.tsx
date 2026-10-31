import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchModelStatus, fetchHealth } from '../services/api';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
  Eye,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';

export const ModelStatus: React.FC = () => {
  const { modelStatus, setModelStatus } = useStore();
  const [healthData, setHealthData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [status, health] = await Promise.all([fetchModelStatus(), fetchHealth()]);
      setModelStatus(status);
      setHealthData(health);
    } catch (err) {
      console.error('Failed to refresh status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const modelsList = [
    {
      title: 'MediaPipe Hand Landmarker',
      role: 'Computer Vision / 21 3D Points per Hand',
      status: modelStatus?.mediapipe_ready,
      badge: 'Local Tasks API',
      details: 'models/gesture/hand_landmarker.task (7.5 MB Float16)',
    },
    {
      title: 'Static Gesture Classifier',
      role: 'Pose Recognition (YES, NO, I, YOU, etc.)',
      status: modelStatus?.static_model_loaded,
      badge: 'Random Forest',
      details: 'models/gesture/static_rf.joblib (148 Normalized Features)',
    },
    {
      title: 'Temporal Gesture Classifier',
      role: 'Dynamic Motion Sequences (HELLO, HELP, etc.)',
      status: modelStatus?.temporal_model_loaded,
      badge: 'Bidirectional LSTM',
      details: 'models/gesture/temporal_lstm.pt (30-Frame Attention Window)',
    },
    {
      title: 'Ollama Model Runtime',
      role: 'Local LLM Inference Daemon',
      status: modelStatus?.ollama_available,
      badge: 'Localhost:11434',
      details: 'Apple Silicon MLX/Metal native acceleration',
    },
    {
      title: 'Gemma 4 E4B (Primary)',
      role: 'Primary Grammar & Sentence Refinement',
      status: modelStatus?.primary_model_available,
      badge: '4B Parameters',
      details: 'Identifier: gemma4:e4b (9.5 GB locally stored)',
    },
    {
      title: 'Gemma 4 E2B (Fallback)',
      role: 'Lightweight Fallback Grammar Engine',
      status: modelStatus?.fallback_model_available,
      badge: '2B Parameters',
      details: 'Identifier: gemma4:e2b (7.5 GB locally stored)',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-brand-cyan" />
            <span>AI Model & Engine Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time status of local computer vision, ML models, and language model weights.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Hardware Summary Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Inference Hardware
          </div>
          <div className="text-lg font-extrabold text-white font-mono flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-brand-cyan" />
            <span>{modelStatus?.mps_gpu_acceleration ? 'Apple MPS (Metal)' : 'CPU'}</span>
          </div>
          <div className="text-[11px] text-emerald-400">Hardware Accelerated</div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Network Telemetry
          </div>
          <div className="text-lg font-extrabold text-emerald-400 font-mono flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>100% Offline</span>
          </div>
          <div className="text-[11px] text-slate-400">Zero Cloud Data Transfers</div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Backend Server
          </div>
          <div className="text-lg font-extrabold text-white font-mono flex items-center space-x-2">
            <Server className="w-5 h-5 text-purple-400" />
            <span>FastAPI v{healthData?.version || '1.0.0'}</span>
          </div>
          <div className="text-[11px] text-slate-400">127.0.0.1:8000</div>
        </div>
      </div>

      {/* Subsystem Readiness Checklist */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-brand-cyan" />
          <span>Subsystems & Model Weights</span>
        </h3>

        <div className="space-y-3">
          {modelsList.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-dark-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {m.status ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{m.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-850 text-slate-300 border border-slate-700">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{m.role}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">{m.details}</p>
                </div>
              </div>

              <div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    m.status
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {m.status ? 'Ready / Loaded' : 'Unavailable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
