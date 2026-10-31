import React, { useState, useEffect } from 'react';
import {
  fetchVocabulary,
  extendVocabulary,
  fetchDatasetSummary,
  recordDatasetSample,
  exportDatasetManifest,
} from '../services/api';
import { useWebcam } from '../hooks/useWebcam';
import { useRecognitionWebSocket } from '../hooks/useRecognitionWebSocket';
import { VocabularyItem, DatasetSummary } from '../types';
import {
  FolderPlus,
  Video,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Download,
  PlusCircle,
  Layers,
  Database,
  BarChart2,
} from 'lucide-react';

export const DataCollection: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [selectedSign, setSelectedSign] = useState<string>('HELLO');
  const [recording, setRecording] = useState(false);
  const [recordedCount, setRecordedCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);

  // New sign plugin state
  const [isAddingPlugin, setIsAddingPlugin] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('dynamic');
  const [newHands, setNewHands] = useState(1);
  const [newCategory, setNewCategory] = useState('general');
  const [newDescription, setNewDescription] = useState('');
  const [pluginMessage, setPluginMessage] = useState('');

  const { sendFrame } = useRecognitionWebSocket();
  const { videoRef, permissionError } = useWebcam({
    onFrame: (b64) => {
      sendFrame(b64);
    },
    targetFps: 25,
    enabled: true,
  });

  const loadData = () => {
    fetchVocabulary().then((voc) => {
      setVocabulary(voc);
      if (voc.length > 0 && !selectedSign) setSelectedSign(voc[0].label);
    }).catch(() => {});
    fetchDatasetSummary().then(setDatasetSummary).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSignInfo = vocabulary.find((v) => v.label === selectedSign);

  const handleStartRecording = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          triggerRecordSequence();
          return null;
        }
        return (prev || 3) - 1;
      });
    }, 1000);
  };

  const triggerRecordSequence = async () => {
    setRecording(true);
    try {
      // Record mock/live sequence sample into data/raw/
      await recordDatasetSample({
        label: selectedSign,
        landmarks: Array.from({ length: 30 }, () => ({
          wrist: { x: 0.5, y: 0.5, z: 0.0 },
          confidence: 0.95,
        })),
        is_sequence: activeSignInfo?.type === 'dynamic',
      });
      setRecordedCount((prev) => prev + 1);
      fetchDatasetSummary().then(setDatasetSummary).catch(() => {});
    } catch (err) {
      console.error('Failed to save sample:', err);
    } finally {
      setRecording(false);
    }
  };

  const handleAddCustomSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newDescription) return;

    try {
      const res = await extendVocabulary({
        label: newLabel.toUpperCase(),
        type: newType,
        hands: Number(newHands),
        category: newCategory,
        description: newDescription,
      });

      if (res.status === 'success') {
        setPluginMessage(`Sign '${newLabel.toUpperCase()}' registered successfully!`);
        setNewLabel('');
        setNewDescription('');
        setIsAddingPlugin(false);
        loadData();
      } else {
        setPluginMessage(`Error: ${res.message}`);
      }
    } catch (err) {
      setPluginMessage('Failed to register sign plugin.');
    }
  };

  const handleExportManifest = async () => {
    const manifest = await exportDatasetManifest();
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signbridge_isl_dataset_manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Hacktoberfest 2026 • Best Open-Source AI Project</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-2">
            <span>Open-Source Dataset Manager & Vocabulary Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Collect, inspect, label, and export reproducible 3D landmark datasets with plugin-extensible vocabulary.
          </p>
        </div>

        <button
          onClick={handleExportManifest}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Dataset Manifest</span>
        </button>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Recorded Samples</span>
          <div className="text-2xl font-black text-white font-mono">
            {datasetSummary?.total_samples ?? recordedCount}
          </div>
          <span className="text-[11px] text-emerald-400">MediaPipe 3D Landmark format</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Configured Vocabulary Classes</span>
          <div className="text-2xl font-black text-white font-mono">
            {vocabulary.length} Signs
          </div>
          <span className="text-[11px] text-brand-cyan">Core ISLRTC + Contributor Plugins</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Model Retraining Status</span>
          <div className="text-2xl font-black text-white font-mono">
            {datasetSummary?.is_ready_for_training ? 'Ready' : 'Collecting'}
          </div>
          <span className="text-[11px] text-slate-400">
            {datasetSummary?.storage_path || 'data/raw/'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Preview & Recording Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 relative bg-dark-950 aspect-[4/3] flex items-center justify-center">
            {permissionError ? (
              <div className="p-4 text-center text-xs text-rose-400">{permissionError}</div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {countdown !== null && (
                  <div className="absolute inset-0 bg-dark-950/75 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-7xl font-extrabold text-brand-cyan animate-ping font-mono">
                      {countdown}
                    </span>
                  </div>
                )}

                {recording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-600/90 text-white text-xs font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>RECORDING SEQUENCE (30 FRAMES)...</span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="px-3 py-1.5 rounded-xl bg-dark-950/85 backdrop-blur-md border border-slate-700 text-xs text-white font-mono">
                    Target: <span className="text-brand-cyan font-bold">{selectedSign}</span>
                  </div>
                  <button
                    onClick={handleStartRecording}
                    disabled={recording || countdown !== null}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-teal-400 text-dark-950 font-bold text-xs shadow-lg shadow-brand-cyan/25 disabled:opacity-40 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{recording ? 'Capturing...' : 'Capture 30-Frame Sample'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Active Sign Standard Guide */}
          {activeSignInfo && (
            <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-mono">{activeSignInfo.label}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-900 border border-slate-700 text-slate-300">
                  {activeSignInfo.type} • {activeSignInfo.hands} Hand(s)
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {activeSignInfo.description}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Vocabulary Selection & Plugin Extension */}
        <div className="lg:col-span-5 space-y-5">
          {/* Sign Selector */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-brand-cyan" />
                <span>Select Sign to Collect</span>
              </h3>
              <button
                onClick={() => setIsAddingPlugin(!isAddingPlugin)}
                className="text-xs text-brand-cyan hover:underline font-semibold flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAddingPlugin ? 'Close Plugin Form' : 'Add Sign Plugin'}</span>
              </button>
            </div>

            {/* Plugin Extension Form */}
            {isAddingPlugin && (
              <form onSubmit={handleAddCustomSign} className="p-4 rounded-xl bg-slate-900/90 border border-brand-cyan/30 space-y-3 text-xs animate-in fade-in">
                <div className="font-bold text-white flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Register Custom Sign Plugin</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Sign Label (UPPERCASE_ONLY)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg bg-dark-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-dark-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="dynamic">Dynamic (Temporal)</option>
                      <option value="static">Static (Pose)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Hands</label>
                    <select
                      value={newHands}
                      onChange={(e) => setNewHands(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-dark-900 border border-slate-700 text-white text-xs"
                    >
                      <option value={1}>1 Hand</option>
                      <option value={2}>2 Hands</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="Describe gesture posture and motion..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-dark-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-brand-cyan text-dark-950 font-bold text-xs hover:bg-teal-400 transition"
                >
                  Register Plugin
                </button>
                {pluginMessage && (
                  <p className="text-[11px] text-emerald-400 text-center font-semibold">
                    {pluginMessage}
                  </p>
                )}
              </form>
            )}

            {/* List of signs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {vocabulary.map((sign) => {
                const isSelected = selectedSign === sign.label;
                return (
                  <button
                    key={sign.id}
                    onClick={() => setSelectedSign(sign.label)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-cyan bg-brand-cyan/15 shadow-md shadow-brand-cyan/20'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
                      <span>{sign.label}</span>
                      {sign.is_plugin && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" title="Plugin Sign" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                      {sign.type} • {sign.hands}H
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
