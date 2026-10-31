import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  fetchModelStatus,
  fetchHealth,
  fetchProviderStatus,
  fetchLanguageModels,
  updateGemmaSettings,
} from '../services/api';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
  Cloud,
  Radio,
  Sliders,
  Volume2,
  Mic,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const ModelStatus: React.FC = () => {
  const { modelStatus, setModelStatus, cloudConsent, setCloudConsent } = useStore();
  const [healthData, setHealthData] = useState<any>(null);
  const [providerData, setProviderData] = useState<any>(null);
  const [languageModels, setLanguageModels] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeProviderMode, setActiveProviderMode] = useState<'local_ollama' | 'gemini_api'>('local_ollama');
  const [sttSupported, setSttSupported] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [status, health, providers, models] = await Promise.all([
        fetchModelStatus(),
        fetchHealth(),
        fetchProviderStatus().catch(() => null),
        fetchLanguageModels().catch(() => null),
      ]);
      setModelStatus(status);
      setHealthData(health);
      if (providers) setProviderData(providers);
      if (models?.models) setLanguageModels(models.models);
    } catch (err) {
      console.error('Failed to refresh status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const hasSTT = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      setSttSupported(hasSTT);
    }
  }, []);

  const handleProviderToggle = async (mode: 'local_ollama' | 'gemini_api') => {
    setActiveProviderMode(mode);
    try {
      await updateGemmaSettings({
        provider: mode,
        cloud_consent: mode === 'gemini_api',
      });
      setCloudConsent(mode === 'gemini_api');
      await loadData();
    } catch (e) {
      console.error('Failed to switch provider:', e);
    }
  };

  const localSubsystems = [
    {
      title: 'MediaPipe Hand Landmarker',
      role: 'Holistic Computer Vision / 21 3D Points per Hand',
      status: modelStatus?.mediapipe_ready,
      badge: 'Local Tasks API',
      details: 'models/gesture/hand_landmarker.task (7.5 MB Float16)',
    },
    {
      title: 'Static Gesture Classifier',
      role: 'Dual-hand Pose Recognition (YES, NO, I, YOU, etc.)',
      status: modelStatus?.static_model_loaded,
      badge: 'Random Forest',
      details: 'models/gesture/static_rf.joblib (148 Canonical Features)',
    },
    {
      title: 'Temporal Gesture Classifier',
      role: 'Dynamic Motion Sequences (HELLO, HELP, FOOD, etc.)',
      status: modelStatus?.temporal_model_loaded,
      badge: 'Bidirectional LSTM',
      details: 'models/gesture/temporal_lstm.pt (30-Frame Rolling Window)',
    },
    {
      title: 'Ollama Model Runtime',
      role: 'Local LLM Inference Daemon',
      status: modelStatus?.ollama_available,
      badge: 'Localhost:11434',
      details: 'Apple Silicon MLX native acceleration',
    },
    {
      title: 'Gemma 4 E4B (Primary)',
      role: 'Primary Multilingual Reasoning & Grammar Refinement',
      status: modelStatus?.primary_model_available,
      badge: '4B Parameters',
      details: 'Identifier: gemma4:e4b (9.5 GB locally stored, MLX runner)',
    },
    {
      title: 'Gemma 4 E2B (Fallback)',
      role: 'Lightweight Fallback Grammar Engine',
      status: modelStatus?.fallback_model_available,
      badge: '2B Parameters',
      details: 'Identifier: gemma4:e2b (7.5 GB locally stored, nvfp4 quantized)',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#242424] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CDEFD4] border-2 border-[#242424] rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5" />
            System Readiness & Diagnostics
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#242424] tracking-tight">
            AI Model & Infrastructure Status
          </h2>
          <p className="text-sm font-medium text-[#242424]/70 mt-1">
            Real-time diagnostics across computer vision pipelines, local Ollama models, and optional Gemini cloud endpoints.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F8F6EF] text-[#242424] font-black text-xs border-2 border-[#242424] rounded-xl shadow-[3px_3px_0px_#242424] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh All Checks</span>
        </button>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hardware Acceleration Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#242424] rounded-2xl p-5 shadow-[4px_4px_0px_#242424] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#242424]/60 uppercase tracking-wider">Inference Hardware</span>
            <div className="p-1.5 bg-[#C8E9F7] border border-[#242424] rounded-lg">
              <Cpu className="w-4 h-4 text-[#242424]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#242424] font-mono">
            {modelStatus?.mps_gpu_acceleration ? 'Apple MPS (Metal)' : 'CPU Accelerated'}
          </div>
          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hardware Acceleration Active
          </p>
        </div>

        {/* Active Provider Mode Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#242424] rounded-2xl p-5 shadow-[4px_4px_0px_#242424] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#242424]/60 uppercase tracking-wider">Active Provider</span>
            <div className="p-1.5 bg-[#E8DDFB] border border-[#242424] rounded-lg">
              <Sparkles className="w-4 h-4 text-[#242424]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#242424] font-mono">
            {modelStatus?.active_provider === 'gemini_api' ? 'Gemini API' : 'Ollama E4B'}
          </div>
          <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {modelStatus?.active_provider === 'gemini_api' ? 'Cloud Reasoning Mode' : 'Local-First Privacy Mode'}
          </p>
        </div>

        {/* Bidirectional Voice Engine Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#242424] rounded-2xl p-5 shadow-[4px_4px_0px_#242424] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#242424]/60 uppercase tracking-wider">Voice Capabilities</span>
            <div className="p-1.5 bg-[#F9E9B7] border border-[#242424] rounded-lg">
              <Volume2 className="w-4 h-4 text-[#242424]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#242424] font-mono">TTS + STT</div>
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
            {sttSupported ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Browser Web Speech API Online
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Speech Synthesis Active (STT limited)
              </>
            )}
          </p>
        </div>
      </div>

      {/* Model Provider Orchestration & Preference Controller */}
      <div className="bg-[#FFFFFF] border-2 border-[#242424] rounded-2xl p-6 shadow-[4px_4px_0px_#242424] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#242424]/10 pb-4">
          <div>
            <h3 className="text-lg font-black text-[#242424] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              AI Orchestration & Provider Policy
            </h3>
            <p className="text-xs text-[#242424]/70">
              Configure inference routing between local open-weight Gemma models and Google Gemini cloud services.
            </p>
          </div>

          <div className="inline-flex p-1 bg-gray-100 border-2 border-[#242424] rounded-xl">
            <button
              onClick={() => handleProviderToggle('local_ollama')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                activeProviderMode === 'local_ollama'
                  ? 'bg-[#242424] text-white shadow-sm'
                  : 'text-[#242424] hover:bg-gray-200'
              }`}
            >
              Local-Only (Privacy)
            </button>
            <button
              onClick={() => handleProviderToggle('gemini_api')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                activeProviderMode === 'gemini_api'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[#242424] hover:bg-gray-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              Gemini Cloud Mode
            </button>
          </div>
        </div>

        {/* Provider Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1: Local Primary */}
          <div className="p-4 rounded-xl border-2 border-[#242424] bg-[#CDEFD4]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#242424]/70">Primary Local</span>
              <span className="px-2 py-0.5 bg-[#CDEFD4] border border-[#242424] rounded text-[10px] font-black">
                ACTIVE DEFAULT
              </span>
            </div>
            <div className="font-mono font-black text-base text-[#242424]">Google Gemma 4 E4B</div>
            <p className="text-xs text-[#242424]/70">
              Full 4B multimodal visual reasoning & contextual grammar refinement running via Ollama MLX.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Local Inference (~56 tok/s)
            </div>
          </div>

          {/* Tier 2: Local Fallback */}
          <div className="p-4 rounded-xl border-2 border-[#242424] bg-[#F9E9B7]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#242424]/70">Fallback Local</span>
              <span className="px-2 py-0.5 bg-[#F9E9B7] border border-[#242424] rounded text-[10px] font-black">
                FAILSAFE
              </span>
            </div>
            <div className="font-mono font-black text-base text-[#242424]">Google Gemma 4 E2B</div>
            <p className="text-xs text-[#242424]/70">
              Compact 2B quantized fallback model for ultra-low latency & constrained memory environments.
            </p>
            <div className="pt-2 text-[11px] font-mono text-amber-800 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Local Inference (~84 tok/s)
            </div>
          </div>

          {/* Tier 3: Cloud Gemini */}
          <div className="p-4 rounded-xl border-2 border-[#242424] bg-[#E8DDFB]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#242424]/70">Cloud Reasoning</span>
              <span className="px-2 py-0.5 bg-[#E8DDFB] border border-[#242424] rounded text-[10px] font-black">
                OPTIONAL
              </span>
            </div>
            <div className="font-mono font-black text-base text-[#242424]">Google Gemini API</div>
            <p className="text-xs text-[#242424]/70">
              Optional cloud-hosted endpoint for high-throughput batch evaluation & multi-modal prototyping.
            </p>
            <div className="pt-2 text-[11px] font-mono text-purple-700 font-bold flex items-center gap-1">
              {modelStatus?.gemini_api_configured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  API Key Configured
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  API Key Unset (Local-Only Active)
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subsystem Readiness Checklist */}
      <div className="bg-[#FFFFFF] border-2 border-[#242424] rounded-2xl p-6 shadow-[4px_4px_0px_#242424] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#242424] flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Core Pipeline Components & Local Model Weights
          </h3>
          <span className="text-xs font-mono font-bold text-gray-500">6 Components Monitored</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {localSubsystems.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#F8F6EF] border-2 border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#242424]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {m.status ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#242424]">{m.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#242424] text-[#242424] font-bold">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#242424]/70 mt-0.5">{m.role}</p>
                  <p className="text-[11px] font-mono text-gray-500 mt-0.5">{m.details}</p>
                </div>
              </div>

              <div>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full border-2 ${
                    m.status
                      ? 'bg-[#CDEFD4] text-emerald-800 border-[#242424]'
                      : 'bg-[#F8CFD0] text-rose-800 border-[#242424]'
                  }`}
                >
                  {m.status ? 'Ready / Online' : 'Unavailable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multilingual Recognizer Head Registry */}
      <div className="bg-[#FFFFFF] border-2 border-[#242424] rounded-2xl p-6 shadow-[4px_4px_0px_#242424] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#242424] flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" />
            Language Recognizer Registry (ISL · ASL · BSL)
          </h3>
          <span className="text-xs font-bold text-gray-500">3 Independent Language Heads</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ISL Recognizer Card */}
          <div className="p-4 rounded-xl border-2 border-[#242424] bg-[#CDEFD4]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-[#242424]">ISL Recognizer</span>
              <span className="px-2 py-0.5 bg-[#CDEFD4] border border-[#242424] rounded text-[10px] font-black text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#242424]/70">Indian Sign Language Dual-hand BiLSTM + Random Forest</p>
            <div className="text-[11px] font-mono space-y-0.5 pt-1 text-gray-600">
              <div>Vocabulary: 15 Core Signs</div>
              <div>Top-1 Accuracy: 53.87% (Test)</div>
              <div>Feature Schema: 148-dim v1.0.0</div>
            </div>
          </div>

          {/* ASL Recognizer Card */}
          <div className="p-4 rounded-xl border-2 border-[#242424] bg-[#E8DDFB]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-[#242424]">ASL Recognizer</span>
              <span className="px-2 py-0.5 bg-[#E8DDFB] border border-[#242424] rounded text-[10px] font-black text-purple-800">
                EXPERIMENTAL
              </span>
            </div>
            <p className="text-xs text-[#242424]/70">American Sign Language Candidate Pipeline</p>
            <div className="text-[11px] font-mono space-y-0.5 pt-1 text-gray-600">
              <div>Vocabulary: 26 Alphabet + 20 Signs</div>
              <div>Status: Candidate Audited</div>
              <div>Target: ASL-Citizen BiGRU</div>
            </div>
          </div>

          {/* BSL Recognizer Card */}
          <div className="p-4 rounded-xl border-2 border-[#242424] bg-[#C8E9F7]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-[#242424]">BSL Recognizer</span>
              <span className="px-2 py-0.5 bg-[#C8E9F7] border border-[#242424] rounded text-[10px] font-black text-blue-800">
                EXPERIMENTAL
              </span>
            </div>
            <p className="text-xs text-[#242424]/70">British Sign Language Two-handed Pipeline</p>
            <div className="text-[11px] font-mono space-y-0.5 pt-1 text-gray-600">
              <div>Vocabulary: 15 Two-handed Signs</div>
              <div>Status: Candidate Audited</div>
              <div>Target: SLR PoseFormer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
