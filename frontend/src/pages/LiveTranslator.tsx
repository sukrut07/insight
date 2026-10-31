import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useCamera } from '../hooks/useCamera';
import { useRecognitionWebSocket } from '../hooks/useRecognitionWebSocket';
import {
  refineTranslation,
  orchestrateTranslation,
  speakText,
  fetchHistory,
  deleteHistory,
  inspectGestureMultimodal,
} from '../services/api';
import { MultimodalInspector } from '../components/MultimodalInspector';
import { DisagreementBanner } from '../components/DisagreementBanner';
import { CameraPermissionDialog } from '../components/CameraPermissionDialog';
import { SignLanguageSelector } from '../components/SignLanguageSelector';
import {
  Play,
  Pause,
  Trash2,
  Sparkles,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Camera,
  CheckCircle2,
  History,
  X,
  Plus,
  Eye,
  RefreshCw,
  Video,
} from 'lucide-react';

export const LiveTranslator: React.FC = () => {
  const {
    currentLabel,
    confidence,
    isStable,
    handsDetected,
    leftHand,
    rightHand,
    fps,
    latencyMs,
    annotatedFrame,
    sentenceTokens,
    removeToken,
    clearTokens,
    addToken,
    isPaused,
    setIsPaused,
    refinedTranslation,
    setRefinedTranslation,
    isRefining,
    setIsRefining,
    openFeedbackModal,
    history,
    setHistory,
    setActiveTab,
    snapshotFrame,
    setSnapshotFrame,
    multimodalResult,
    setMultimodalResult,
    isInspecting,
    setIsInspecting,
    cloudConsent,
    activeLanguage,
    accessibility,
  } = useStore();

  const [customWordInput, setCustomWordInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);

  // WebSocket hook for live frame streaming
  const { sendFrame, resetBuffer } = useRecognitionWebSocket();

  // Controlled Camera hook with explicit user permission
  const {
    status: cameraStatus,
    devices,
    selectedDeviceId,
    error: cameraError,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    isActive: isCameraActive,
  } = useCamera({
    onFrame: (b64) => {
      if (!isPaused && isCameraActive) {
        sendFrame(b64);
      }
    },
    targetFps: 25,
    autoStart: false,
  });

  const handleInspectGesture = async () => {
    if (!annotatedFrame || currentLabel === 'NONE') return;
    setIsInspecting(true);
    setSnapshotFrame(annotatedFrame);
    try {
      const result = await inspectGestureMultimodal({
        image_base64: annotatedFrame,
        predicted_label: currentLabel,
        confidence,
        hands_detected: handsDetected,
        left_hand_present: leftHand,
        right_hand_present: rightHand,
        user_consent_cloud: cloudConsent,
      });
      setMultimodalResult(result);
    } catch (err) {
      console.error('Inspection failed:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  // Sample stabilized frames for Gemma multimodal verification (debounced)
  useEffect(() => {
    if (isStable && currentLabel !== 'NONE' && annotatedFrame && !isInspecting && !multimodalResult) {
      const timer = setTimeout(() => {
        handleInspectGesture();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isStable, currentLabel, annotatedFrame]);

  // Load history on mount
  useEffect(() => {
    fetchHistory().then(setHistory).catch(() => {});
  }, [setHistory]);

  const handleRefine = async () => {
    if (sentenceTokens.length === 0) return;
    setIsRefining(true);
    try {
      const payload = sentenceTokens.map((t) => ({ word: t.word, confidence: t.confidence }));
      const result = await orchestrateTranslation({
        language: activeLanguage,
        signs: payload,
        visual_frame_base64: annotatedFrame,
      });

      const refined = {
        refined_sentence: result.readable_translation || result.refined_sentence || '',
        original_tokens: result.recognized_sequence || result.original_tokens || [],
        alternatives: result.suggestions || result.alternatives || [],
        notes: result.grammar_notes || result.notes,
        model_used: `${result.model || 'gemma4:e4b'} (${result.language || activeLanguage})`,
        execution_time_ms: result.latency_ms || 120,
        is_fallback: result.provider === 'local_rule_fallback',
      };
      setRefinedTranslation(refined);

      if (accessibility.speechOutput && refined.refined_sentence) {
        speakText(refined.refined_sentence, undefined, accessibility.speechRate);
      }

      // Refresh history
      fetchHistory().then(setHistory).catch(() => {});
    } catch (err) {
      console.error('Orchestration failed:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!text) return;
    setIsPlayingAudio(true);
    try {
      await speakText(text);
    } catch (err) {
      console.error('TTS failed:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleAddManualWord = () => {
    if (customWordInput.trim()) {
      addToken(customWordInput.trim().toUpperCase(), 1.0);
      setCustomWordInput('');
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await deleteHistory(id);
      setHistory(history.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Delete history failed:', err);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-6 space-y-6 ${accessibility.highContrast ? 'contrast-125' : ''}`}>
      {/* Top Banner & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span
              className={`flex h-3 w-3 rounded-full ${
                handsDetected > 0 ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            {handsDetected > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 top-0" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>SignBridge Multilingual Engine</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-dark-900 border border-slate-700 text-brand-cyan">
                {handsDetected} {handsDetected === 1 ? 'Hand' : 'Hands'} ({[leftHand && 'Left', rightHand && 'Right'].filter(Boolean).join(' + ') || 'None'})
              </span>
            </h2>
            <p className="text-xs text-slate-400">MediaPipe Holistic 553 landmarks & Gemma 4 E4B local orchestration</p>
          </div>
        </div>

        {/* Central Language Selector */}
        <SignLanguageSelector />

        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 font-mono">
            <span>{fps.toFixed(0)} FPS</span>
            <span className="text-slate-600">•</span>
            <span>{latencyMs.toFixed(0)}ms latency</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              isPaused
                ? 'bg-amber-500 text-dark-950 hover:bg-amber-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={() => {
              clearTokens();
              resetBuffer();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
            title="Clear current translation buffer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Disagreement Human-in-the-Loop Banner */}
      <DisagreementBanner />

      {/* Main Grid: Video Stream Left, Sign & Sentence Builder Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video, Skeleton Overlay & Multimodal Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 relative bg-dark-950 aspect-[4/3] flex items-center justify-center">
            {!isCameraActive ? (
              <div className="p-8 text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-3xl bg-brand-cyan/10 border border-brand-cyan/25 flex items-center justify-center mx-auto text-brand-cyan">
                  <Video className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Camera Stream Standby</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    SignBridge processes camera video locally in browser without cloud streaming.
                    Click below to authorize your camera device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraDialogOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-brand-cyan text-dark-950 font-bold text-xs hover:bg-cyan-400 shadow-lg shadow-brand-cyan/20 transition-all"
                >
                  Enable Camera
                </button>
              </div>
            ) : (
              <>
                {/* Real video feed (underneath or used for capture) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    annotatedFrame ? 'hidden' : 'block'
                  }`}
                />

                {/* Annotated skeleton feed with OpenCV line overlay */}
                {annotatedFrame && (
                  <img
                    src={annotatedFrame}
                    alt="Landmark Skeleton Tracking"
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                )}

                {/* Overlaid Live Status Pill */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg bg-dark-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>21 3D LANDMARKS / HAND</span>
                  </span>
                </div>

                {/* Fast Trigger Button on Video Overlay */}
                {currentLabel && currentLabel !== 'NONE' && (
                  <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                    <button
                      onClick={handleInspectGesture}
                      disabled={isInspecting}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-cyan to-teal-500 text-dark-950 text-xs font-bold hover:brightness-110 flex items-center space-x-1.5 shadow-lg transition"
                    >
                      {isInspecting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Gemma 4 Inspect</span>
                    </button>
                    <button
                      onClick={() => openFeedbackModal(currentLabel)}
                      className="px-2.5 py-1.5 rounded-lg bg-dark-950/85 backdrop-blur-md border border-slate-700 text-xs text-slate-300 hover:text-amber-400 hover:border-amber-400/40 flex items-center space-x-1 transition shadow-lg"
                      title="Report wrong sign"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Multimodal Gesture Inspector (Layer 2) */}
          <MultimodalInspector />

          {/* Quick Verified Signs Cheat Sheet */}
          <div className="glass-panel p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Supported ISLRTC Sign Vocabulary:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'HELLO', 'GOODBYE', 'THANK_YOU', 'PLEASE', 'SORRY', 'HELP',
                'YES', 'NO', 'WATER', 'FOOD', 'I', 'YOU', 'MY', 'WHAT', 'WHERE'
              ].map((v) => (
                <span
                  key={v}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    currentLabel === v
                      ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold scale-105'
                      : 'bg-dark-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Detection Card & Sentence Assembler */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Gesture Predictor Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Recognized Gesture
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isStable
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isStable ? 'Stable Detection' : 'Smoothing Window...'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {currentLabel === 'NONE' ? (
                  <span className="text-slate-600">Waiting for sign...</span>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-teal-400">
                    {currentLabel}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-200">
                  {Math.round(confidence * 100)}%
                </div>
                <div className="text-[10px] text-slate-500">Confidence</div>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-200 ${
                  confidence > 0.75
                    ? 'bg-brand-cyan'
                    : confidence > 0.50
                    ? 'bg-amber-400'
                    : 'bg-slate-700'
                }`}
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
          </div>

          {/* Real-time Sentence Builder */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Current Sentence Buffer</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-dark-900 text-slate-400 border border-slate-800">
                  {sentenceTokens.length} tokens
                </span>
              </div>
              <button
                onClick={clearTokens}
                disabled={sentenceTokens.length === 0}
                className="text-slate-500 hover:text-rose-400 text-xs flex items-center space-x-1 disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Token Pill Tray */}
            <div className="min-h-[72px] p-3 rounded-xl bg-dark-900/90 border border-slate-800/80 flex flex-wrap gap-2 items-center">
              {sentenceTokens.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Signs performed in camera view will automatically append here...
                </p>
              ) : (
                sentenceTokens.map((token, idx) => (
                  <div
                    key={`${token.word}-${idx}`}
                    className="group inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-850 border border-slate-700 text-xs text-slate-200 font-semibold shadow-sm hover:border-brand-cyan transition-all"
                  >
                    <span>{token.word}</span>
                    <button
                      onClick={() => removeToken(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                      title="Remove word"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Manual Word Add Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Manually add or edit word..."
                value={customWordInput}
                onChange={(e) => setCustomWordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualWord()}
                className="flex-1 bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
              />
              <button
                onClick={handleAddManualWord}
                className="px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Refinement Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleRefine}
                disabled={sentenceTokens.length === 0 || isRefining}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-teal-500 text-dark-950 font-bold text-xs shadow-md shadow-brand-cyan/20 hover:brightness-110 disabled:opacity-40 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRefining ? 'Gemma 4 Refining...' : 'Refine with Gemma 4'}</span>
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold border border-slate-700"
              >
                Open Full Editor
              </button>
            </div>

            {/* Refined Sentence Output Preview */}
            {refinedTranslation && (
              <div className="p-4 rounded-xl bg-dark-900/90 border border-brand-cyan/30 space-y-2 mt-3 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-brand-cyan font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Refined by {refinedTranslation.model_used}</span>
                  </span>
                  <span className="font-mono text-slate-400">
                    {refinedTranslation.execution_time_ms.toFixed(0)}ms
                  </span>
                </div>
                <p className="text-sm font-bold text-white">
                  "{refinedTranslation.refined_sentence}"
                </p>
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleSpeak(refinedTranslation.refined_sentence)}
                    disabled={isPlayingAudio}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/30 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speak</span>
                  </button>
                  {refinedTranslation.notes && (
                    <span className="text-[11px] text-slate-400 italic">
                      {refinedTranslation.notes}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Translation History Drawer */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <History className="w-4 h-4 text-slate-400" />
                <span>Recent Translations ({history.length})</span>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No past translations yet.</p>
              ) : (
                history.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-dark-900 border border-slate-800/80 flex items-center justify-between text-xs group"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="font-semibold text-slate-200">"{item.refined_sentence}"</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Tokens: {item.raw_tokens.join(' • ')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleSpeak(item.refined_sentence)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        title="Speak"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controlled Camera Permission Dialog */}
      <CameraPermissionDialog
        isOpen={isCameraDialogOpen}
        onClose={() => setIsCameraDialogOpen(false)}
        onEnableCamera={async (devId) => {
          const ok = await startCamera(devId);
          return ok;
        }}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={(id) => switchCamera(id)}
        error={cameraError}
        isRequesting={cameraStatus === 'requesting'}
      />
    </div>
  );
};
