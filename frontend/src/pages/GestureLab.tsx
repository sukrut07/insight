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
import { GestureLabKpis } from '../components/GestureLabKpis';
import { RecognitionExplanationPanel } from '../components/RecognitionExplanationPanel';
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
  Copy,
  Check,
  FlipHorizontal,
  Layers,
} from 'lucide-react';
import { SignLanguageId } from '../types';

export const GestureLab: React.FC = () => {
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
    setActiveLanguage,
    accessibility,
    updateAccessibility,
  } = useStore();

  const [customWordInput, setCustomWordInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);

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
      }, 700);
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

  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* =========================================================================
          WORKSPACE HEADER
         ========================================================================= */}
      <div className="neo-card bg-white p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="neo-pill bg-pastel-mint text-charcoal text-[11px] font-bold">
                Gesture Lab Workspace
              </span>
              <span className="text-xs font-mono text-charcoal-muted">
                v2.0 • MediaPipe + Gemma 4 E4B
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-charcoal">
              Your gesture workspace.
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted">
              Select a sign language, enable your camera, and begin real-time gesture translation.
            </p>
          </div>

          {/* Sign Language Selector in Neo-Brutalist Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-cream-100 border-2 border-charcoal rounded-2xl shadow-hard-xs">
            {(['ISL', 'BSL', 'ASL'] as SignLanguageId[]).map((lang) => {
              const isSelected = activeLanguage === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-charcoal text-cream-100 shadow-sm'
                      : 'text-charcoal hover:bg-cream-200'
                  }`}
                >
                  <span className="mr-1.5">
                    {lang === 'ISL' ? '🇮🇳' : lang === 'BSL' ? '🇬🇧' : '🇺🇸'}
                  </span>
                  <span>{lang}</span>
                  {lang === 'ISL' ? (
                    <span className="ml-1.5 text-[9px] uppercase px-1 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Live
                    </span>
                  ) : (
                    <span className="ml-1.5 text-[9px] uppercase px-1 py-0.5 rounded bg-amber-100 text-amber-800">
                      Beta
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Disagreement banner if Gemma flagged an ambiguity */}
      <DisagreementBanner />

      {/* Live Session Telemetry & KPI Cards */}
      <GestureLabKpis />

      {/* =========================================================================
          MAIN WORKSPACE GRID: CAMERA VIEWPORT & RECOGNITION PANEL
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Camera Viewport (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="neo-card bg-white p-5 space-y-4">
            {/* Viewport Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-charcoal text-xs">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full border border-charcoal ${
                    isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span className="font-bold text-charcoal">
                  {isCameraActive ? 'Camera Active' : 'Camera Disconnected'}
                </span>
                <span className="text-charcoal-muted">•</span>
                <span className="font-mono text-charcoal-muted">
                  {handsDetected} {handsDetected === 1 ? 'Hand' : 'Hands'} (
                  {[leftHand && 'Left', rightHand && 'Right'].filter(Boolean).join(' + ') || 'None'}
                  )
                </span>
              </div>

              {/* Viewport Action Toggles */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMirrored(!isMirrored)}
                  title="Flip Video Mirroring"
                  className={`p-1.5 rounded-lg border-2 border-charcoal font-bold text-xs transition-all ${
                    isMirrored ? 'bg-pastel-mint text-charcoal' : 'bg-white text-charcoal-muted'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateAccessibility({
                      showLandmarksOverlay: !accessibility.showLandmarksOverlay,
                    })
                  }
                  title="Toggle MediaPipe Skeleton Overlay"
                  className={`p-1.5 rounded-lg border-2 border-charcoal font-bold text-xs transition-all ${
                    accessibility.showLandmarksOverlay
                      ? 'bg-pastel-blue text-charcoal'
                      : 'bg-white text-charcoal-muted'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Viewport Frame */}
            <div className="relative aspect-video rounded-2xl bg-charcoal border-2 border-charcoal overflow-hidden shadow-hard flex items-center justify-center">
              {/* Actual Video Track */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''} ${
                  !isCameraActive ? 'hidden' : ''
                }`}
              />

              {/* Annotated Frame Overlay (MediaPipe Landmarks) */}
              {isCameraActive && annotatedFrame && accessibility.showLandmarksOverlay && (
                <img
                  src={annotatedFrame}
                  alt="Tracked Landmarks"
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                    isMirrored ? '-scale-x-100' : ''
                  }`}
                />
              )}

              {/* Camera Off State */}
              {!isCameraActive && (
                <div className="text-center p-8 space-y-4 max-w-sm z-10">
                  <div className="w-16 h-16 rounded-2xl bg-cream-100 border-2 border-charcoal flex items-center justify-center mx-auto text-2xl shadow-hard-xs">
                    📷
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-white font-bold text-sm">Camera Offline</h3>
                    <p className="text-xs text-white/70">
                      Click below to request camera permission and begin gesture recognition.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCameraDialogOpen(true)}
                    className="neo-btn bg-pastel-mint hover:bg-pastel-yellow text-charcoal px-6 py-2.5 text-xs font-bold inline-flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Camera Session</span>
                  </button>
                </div>
              )}

              {/* Watermark / Latency Stats */}
              {isCameraActive && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/90 bg-charcoal/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                  <span>{fps.toFixed(0)} FPS</span>
                  <span>Latency: {latencyMs.toFixed(0)}ms</span>
                  <span>Model: {activeLanguage} 24-Signs</span>
                </div>
              )}
            </div>

            {/* Viewport Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="neo-btn bg-pastel-pink text-charcoal px-4 py-2 text-xs font-bold flex items-center space-x-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCameraDialogOpen(true)}
                    className="neo-btn bg-pastel-mint text-charcoal px-4 py-2 text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Camera</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  disabled={!isCameraActive}
                  className={`neo-btn px-4 py-2 text-xs font-bold flex items-center space-x-1.5 ${
                    isPaused ? 'bg-pastel-yellow' : 'bg-white'
                  } ${!isCameraActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
                </button>
              </div>

              {/* Device Selector */}
              {devices.length > 1 && (
                <select
                  value={selectedDeviceId || ''}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="neo-pill bg-white text-xs font-bold text-charcoal px-3 py-1.5 cursor-pointer"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Recognition & Sentence Builder (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Recognition Card */}
          <div className="neo-card bg-pastel-mint p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-charcoal">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal">
                Active Recognition
              </span>
              <span
                className={`neo-pill text-[10px] font-bold ${
                  isStable ? 'bg-white text-emerald-800' : 'bg-cream-100 text-charcoal-muted'
                }`}
              >
                {isStable ? '✓ Stable Gesture' : 'Tracking...'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-charcoal-muted font-bold font-mono">DETECTED SIGN:</div>
              <div className="text-3xl font-black font-display text-charcoal tracking-tight">
                {currentLabel !== 'NONE' ? currentLabel : 'Waiting for gesture...'}
              </div>

              {/* Confidence Progress Meter */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs font-bold font-mono">
                  <span>Confidence:</span>
                  <span>{currentLabel !== 'NONE' ? `${(confidence * 100).toFixed(1)}%` : '0.0%'}</span>
                </div>
                <div className="w-full h-3 bg-white border-2 border-charcoal rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-charcoal rounded-full transition-all duration-200"
                    style={{ width: `${currentLabel !== 'NONE' ? Math.min(100, Math.max(0, confidence * 100)) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action: Add Detected Sign to Sentence */}
            {currentLabel !== 'NONE' && (
              <button
                type="button"
                onClick={() => addToken(currentLabel, confidence)}
                className="neo-btn bg-white hover:bg-cream-100 text-charcoal w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Append "{currentLabel}" to Sequence</span>
              </button>
            )}
          </div>

          {/* Sentence Builder & Gemma 4 Orchestration Card */}
          <div className="neo-card bg-white p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-charcoal">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal">
                Sentence Builder
              </span>
              <span className="text-xs font-mono font-bold text-charcoal-muted">
                {sentenceTokens.length} {sentenceTokens.length === 1 ? 'Token' : 'Tokens'}
              </span>
            </div>

            {/* Token Chips */}
            <div className="min-h-[64px] p-3 rounded-2xl bg-cream-100 border-2 border-charcoal flex flex-wrap items-center gap-2">
              {sentenceTokens.length === 0 ? (
                <span className="text-xs text-charcoal-muted italic">
                  Recognized sign tokens will appear here. Or type below to manually add words.
                </span>
              ) : (
                sentenceTokens.map((token, idx) => (
                  <span
                    key={`${token.word}-${idx}`}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-white border-2 border-charcoal rounded-xl text-xs font-bold shadow-hard-xs"
                  >
                    <span>{token.word}</span>
                    <button
                      type="button"
                      onClick={() => removeToken(idx)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Manual Word Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customWordInput}
                onChange={(e) => setCustomWordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualWord()}
                placeholder="Add word manually..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border-2 border-charcoal text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pastel-mint"
              />
              <button
                type="button"
                onClick={handleAddManualWord}
                className="neo-btn bg-pastel-yellow text-charcoal px-3.5 py-2 text-xs font-bold"
              >
                Add
              </button>
              <button
                type="button"
                onClick={clearTokens}
                title="Clear all tokens"
                className="p-2 rounded-xl border-2 border-charcoal bg-white hover:bg-red-50 text-charcoal"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>

            {/* Gemma 4 Orchestration Trigger Button */}
            <button
              type="button"
              onClick={handleRefine}
              disabled={sentenceTokens.length === 0 || isRefining}
              className={`neo-btn w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 ${
                isRefining
                  ? 'bg-pastel-lavender/50 cursor-wait'
                  : 'bg-pastel-lavender hover:bg-pastel-pink text-charcoal'
              } ${sentenceTokens.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>{isRefining ? 'Orchestrating with Gemma 4...' : 'Refine with Gemma 4 E4B'}</span>
            </button>

            {/* Translation Output Box */}
            {refinedTranslation && (
              <div className="neo-card bg-cream-100 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-charcoal-muted">
                  <span>TRANSLATED OUTPUT:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(refinedTranslation.refined_sentence)}
                      className="p-1 rounded hover:bg-white text-charcoal"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpeak(refinedTranslation.refined_sentence)}
                      disabled={isPlayingAudio}
                      className="p-1 rounded hover:bg-white text-charcoal"
                      title="Speak translated text"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'text-emerald-600 animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-bold text-charcoal leading-relaxed">
                  "{refinedTranslation.refined_sentence}"
                </p>

                {refinedTranslation.notes && (
                  <p className="text-[11px] text-charcoal-muted border-t border-charcoal/10 pt-2 italic">
                    Grammar note: {refinedTranslation.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multimodal Gesture Inspector Modal/Card (Layer 2) */}
      {multimodalResult && (
        <div className="neo-card bg-white p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-charcoal">
            <span className="neo-pill bg-pastel-blue text-charcoal text-xs font-bold">
              Gemma 4 Multimodal Verification
            </span>
            <button
              onClick={() => setMultimodalResult(null)}
              className="p-1 rounded hover:bg-cream-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <MultimodalInspector />
        </div>
      )}

      {/* Recognition Explanation & Physics Panel */}
      <RecognitionExplanationPanel />

      {/* Camera Permission Dialog */}
      <CameraPermissionDialog
        isOpen={isCameraDialogOpen}
        onClose={() => setIsCameraDialogOpen(false)}
        onEnableCamera={async (deviceId) => {
          const success = await startCamera(deviceId);
          if (success) setIsCameraDialogOpen(false);
          return success;
        }}
        devices={devices}
        selectedDeviceId={selectedDeviceId || ''}
        onSelectDevice={(id) => switchCamera(id)}
        error={cameraError}
        isRequesting={cameraStatus === 'requesting'}
      />
    </div>
  );
};
