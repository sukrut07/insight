import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  fetchGemmaEvaluation,
  compareModels,
  updateGemmaSettings,
  fetchModelStatus,
} from '../services/api';
import { GemmaEvaluationStats, ModelBenchmarkResult } from '../types';
import {
  Cpu,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Globe,
  Lock,
  Flame,
  ArrowRight,
  BarChart,
  Activity,
  Sliders,
  Check,
} from 'lucide-react';

export const GemmaDashboard: React.FC = () => {
  const { modelStatus, setModelStatus } = useStore();
  const [stats, setStats] = useState<GemmaEvaluationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<ModelBenchmarkResult[]>([]);

  // Settings state
  const [selectedProvider, setSelectedProvider] = useState<'local_ollama' | 'gemini_api'>('local_ollama');
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState('gemma4:e4b');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [cloudConsent, setCloudConsent] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [evalStats, modStatus] = await Promise.all([
        fetchGemmaEvaluation(),
        fetchModelStatus(),
      ]);
      setStats(evalStats);
      setModelStatus(modStatus);
      setSelectedProvider(evalStats.active_provider as any || 'local_ollama');
      setSelectedPrimaryModel(evalStats.active_primary_model || 'gemma4:e4b');
    } catch (err) {
      console.error('Failed to load Gemma stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await updateGemmaSettings({
        provider: selectedProvider,
        primary_model: selectedPrimaryModel,
        gemini_api_key: geminiApiKey,
        cloud_consent: cloudConsent,
      });
      setSettingsSavedMessage('Settings successfully saved.');
      setTimeout(() => setSettingsSavedMessage(''), 3000);
      loadData();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleRunComparison = async () => {
    setIsComparing(true);
    try {
      const res = await compareModels({
        sample_signs: ['HELLO', 'THANK_YOU', 'HELP'],
        predicted_label: 'HELP',
        confidence: 0.94,
      });
      setBenchmarkResults(res.results);
    } catch (err) {
      console.error('Failed to run comparison:', err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hacktoberfest 2026 • Best Use of Gemma 4</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <span>Gemma 4 Multimodal Intelligence Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual reasoning metrics, local vs. hosted provider runtime, and model latency telemetry.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 4 Core Gemma Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Model Runtime</span>
            <Cpu className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="text-xl font-black text-white font-mono tracking-tight">
            {stats?.active_primary_model || 'gemma4:e4b'}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {stats?.active_provider === 'gemini_api' ? 'Hosted API Mode' : 'Local Ollama (Offline)'}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Multimodal Capability</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {stats?.multimodal_supported ? 'Native Vision' : 'Landmark AI'}
          </div>
          <div className="text-[11px] text-slate-400">
            {stats?.multimodal_supported
              ? 'Accepts raw JPEG images + landmarks'
              : 'Geometric landmark reasoning active'}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Measured Avg Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white font-mono tracking-tight">
            {stats?.average_latency_ms ? `${stats.average_latency_ms} ms` : 'Sub-50ms'}
          </div>
          <div className="text-[11px] text-slate-400">
            Apple Silicon MPS GPU accelerated
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Disagreement Events</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-white font-mono tracking-tight">
            {stats?.disagreements_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">
            Flagged for Human Review ({stats?.disagreement_rate ?? 0}%)
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Comparison (E4B vs E2B vs Hosted Gemini API) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-brand-cyan" />
              <span>Model Comparison & Latency Benchmark</span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluate real inference time and structured JSON outputs across local Gemma 4 E4B, E2B, and hosted Gemini API.
            </p>
          </div>

          <button
            onClick={handleRunComparison}
            disabled={isComparing}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-teal-500 text-dark-950 font-bold text-xs shadow-md hover:scale-[1.02] transition"
          >
            {isComparing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Benchmark...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Execute Benchmark</span>
              </>
            )}
          </button>
        </div>

        {benchmarkResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benchmarkResults.map((bm) => (
              <div
                key={bm.model_name}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">{bm.model_name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      bm.status === 'success'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {bm.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Provider</span>
                    <span className="font-mono text-slate-200">{bm.provider}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Inference Latency</span>
                    <span className="font-mono text-brand-cyan font-bold">{bm.latency_ms} ms</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Structured JSON</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {bm.structured_valid ? 'Valid' : 'Text Fallback'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-dark-950 border border-slate-800/80 text-[11px] text-slate-300 font-mono italic">
                  "{bm.output_preview}"
                </div>

                <p className="text-[10px] text-slate-500">{bm.notes}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400 space-y-2">
            <Zap className="w-6 h-6 mx-auto text-slate-600" />
            <p>Click "Execute Benchmark" to test E4B, E2B, and hosted endpoints side by side.</p>
          </div>
        )}
      </div>

      {/* Runtime Configuration & Optional Gemini API Prototype Mode */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-brand-purple" />
            <span>Model Provider & Privacy Settings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure local offline execution or toggle the optional hosted Gemini API rapid prototyping mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provider Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-300 block">Inference Execution Provider</label>
            <div className="space-y-3">
              <label
                onClick={() => setSelectedProvider('local_ollama')}
                className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition ${
                  selectedProvider === 'local_ollama'
                    ? 'border-brand-cyan bg-brand-cyan/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  checked={selectedProvider === 'local_ollama'}
                  onChange={() => setSelectedProvider('local_ollama')}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">Local Ollama (Recommended)</span>
                    <span className="px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      100% Offline
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Gemma 4 runs purely on local hardware via Ollama. No camera frames or sign data leave this machine.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setSelectedProvider('gemini_api')}
                className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition ${
                  selectedProvider === 'gemini_api'
                    ? 'border-brand-purple bg-brand-purple/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  checked={selectedProvider === 'gemini_api'}
                  onChange={() => setSelectedProvider('gemini_api')}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">Hosted Gemini API Prototype Mode</span>
                    <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Internet Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Rapid prototyping mode referencing Google's officially documented Gemma API models (gemma-4-31b-it / gemma-4-26b-a4b-it).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Primary Local Model Tag
              </label>
              <select
                value={selectedPrimaryModel}
                onChange={(e) => setSelectedPrimaryModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-cyan"
              >
                <option value="gemma4:e4b">gemma4:e4b (Primary Multimodal 4B)</option>
                <option value="gemma4:e2b">gemma4:e2b (Lightweight Fallback 2B)</option>
                <option value="gemma4">gemma4</option>
              </select>
            </div>

            {selectedProvider === 'gemini_api' && (
              <div className="space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-in fade-in">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Google AI Studio / Gemini API Key
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-brand-purple"
                  />
                </div>

                <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={cloudConsent}
                    onChange={(e) => setCloudConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I explicitly consent to sending sampled hand gesture images to the hosted Google Gemini API endpoint for prototyping purposes.
                  </span>
                </label>
              </div>
            )}

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
            >
              Save Configuration
            </button>

            {settingsSavedMessage && (
              <div className="text-center text-xs text-emerald-400 font-semibold animate-in fade-in">
                {settingsSavedMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disagreement Audit Log Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Visual/Classifier Disagreement Audit Log</span>
            </h2>
            <p className="text-xs text-slate-400">
              Permanent local record of occurrences where Gemma 4 visual reasoning flagged a discrepancy.
            </p>
          </div>
        </div>

        {stats?.recent_disagreements && stats.recent_disagreements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Classifier Pred</th>
                  <th className="py-2.5 px-3">Conf</th>
                  <th className="py-2.5 px-3">Gemma Visual Observation</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {stats.recent_disagreements.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(d.timestamp * 1000).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white font-mono">{d.predicted_label}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      {Math.round(d.classifier_confidence * 100)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {d.gemma_observation}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No active disagreements recorded. The classifier and Gemma visual reasoning are currently in harmony.
          </div>
        )}
      </div>
    </div>
  );
};
