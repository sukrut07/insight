import React from 'react';
import { useStore } from '../store/useStore';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export const MultimodalInspector: React.FC = () => {
  const {
    currentLabel,
    confidence,
    handsDetected,
    leftHand,
    rightHand,
    snapshotFrame,
    multimodalResult,
    isInspecting,
    openFeedbackModal,
  } = useStore();

  if (!snapshotFrame && !multimodalResult) {
    return (
      <div className="neo-card bg-cream-100 p-5 text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-xl bg-pastel-mint border-2 border-charcoal flex items-center justify-center text-charcoal shadow-hard-xs">
          <Eye className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-black font-display text-charcoal">Multimodal Gesture Inspector</h4>
        <p className="text-xs text-charcoal-muted max-w-md mx-auto">
          Stabilize any sign in front of the camera to perform genuine multimodal visual reasoning with Gemma 4 E4B.
        </p>
      </div>
    );
  }

  const isDiscrepancy = multimodalResult?.discrepancy_detected ?? false;

  return (
    <div className="neo-card bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-charcoal pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-pastel-lavender border-2 border-charcoal flex items-center justify-center text-charcoal font-bold shadow-hard-xs">
            <Sparkles className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black font-display text-charcoal">Layer 2 • Multimodal Visual Inspector</h3>
              <span className="neo-pill bg-pastel-yellow text-charcoal text-[10px] font-bold">
                {multimodalResult?.model_used || 'Gemma 4 E4B'}
              </span>
            </div>
            <p className="text-[11px] text-charcoal-muted">
              Cross-evaluating MediaPipe landmarks & raw webcam frame with Gemma 4 visual reasoning.
            </p>
          </div>
        </div>

        {isInspecting ? (
          <div className="flex items-center space-x-1.5 text-xs text-charcoal font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Reasoning...</span>
          </div>
        ) : isDiscrepancy ? (
          <span className="neo-pill bg-pastel-pink text-charcoal text-xs font-bold flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Discrepancy Flagged</span>
          </span>
        ) : (
          <span className="neo-pill bg-pastel-mint text-charcoal text-xs font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Visually Consistent</span>
          </span>
        )}
      </div>

      {/* Main Visual & Inference Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Captured Frame & Landmark Skeleton */}
        <div className="md:col-span-5 space-y-2">
          <div className="relative rounded-2xl overflow-hidden border-2 border-charcoal bg-charcoal aspect-video flex items-center justify-center shadow-hard-xs">
            {snapshotFrame ? (
              <img
                src={snapshotFrame}
                alt="Gesture Snapshot"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs text-white/50 flex flex-col items-center space-y-1">
                <Eye className="w-6 h-6 text-white/40" />
                <span>No frame captured</span>
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-charcoal/80 text-[10px] font-mono text-white border border-white/20">
              Sampled Frame
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-charcoal/80 text-[10px] font-mono text-pastel-mint border border-white/20">
              {handsDetected} Hand(s) • {leftHand ? 'L ' : ''}{rightHand ? 'R' : ''}
            </div>
          </div>

          {/* Classifier Prediction Card */}
          <div className="p-3 rounded-xl bg-cream-100 border-2 border-charcoal text-xs space-y-1">
            <div className="flex items-center justify-between text-charcoal-muted">
              <span className="font-bold">ML Classifier Prediction</span>
              <span className="font-mono text-emerald-800 font-bold">
                {Math.round((confidence || 0) * 100)}% Conf
              </span>
            </div>
            <div className="text-base font-black font-display text-charcoal tracking-wide">
              {currentLabel || 'UNKNOWN'}
            </div>
          </div>
        </div>

        {/* Right: Gemma 4 Visual Reasoning Output */}
        <div className="md:col-span-7 space-y-3">
          {/* Visual Observation */}
          <div className="p-3.5 rounded-2xl bg-cream-100 border-2 border-charcoal space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-charcoal">
              <Eye className="w-3.5 h-3.5 text-purple-700" />
              <span>Gemma 4 Visual Observations</span>
            </div>
            <p className="text-xs text-charcoal leading-relaxed italic">
              "{multimodalResult?.visual_observations || 'Observing hand orientation and finger extensions...'}"
            </p>
          </div>

          {/* Discrepancy Alert / Consistency Box */}
          {isDiscrepancy ? (
            <div className="p-3 rounded-2xl bg-pastel-pink border-2 border-charcoal text-xs space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span>Recognition Discrepancy Detected</span>
              </div>
              <p className="text-charcoal leading-relaxed text-[11px]">
                {multimodalResult?.discrepancy_details ||
                  'Visual observations do not fully align with the classifier output.'}
              </p>
              {multimodalResult?.suggested_alternatives && multimodalResult.suggested_alternatives.length > 0 && (
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-charcoal-muted font-bold">Suggested:</span>
                  {multimodalResult.suggested_alternatives.map((alt) => (
                    <button
                      key={alt}
                      onClick={() => openFeedbackModal(alt)}
                      className="neo-btn bg-white hover:bg-cream-100 text-charcoal px-2 py-0.5 text-[10px] font-bold"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-pastel-mint border-2 border-charcoal text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                <span>Visual Evidence Corroborates Prediction</span>
              </div>
              <p className="text-charcoal leading-relaxed text-[11px]">
                {multimodalResult?.explanation ||
                  'Detected hand landmarks and spatial geometry correspond to standard ISL gesture execution.'}
              </p>
            </div>
          )}

          {/* 3-Layer Step Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
            <div className="p-2 rounded-xl bg-white border-2 border-charcoal text-center space-y-0.5 shadow-hard-xs">
              <span className="text-charcoal-muted font-mono block">Layer 1</span>
              <span className="font-bold text-charcoal block">MediaPipe CV</span>
              <span className="text-emerald-800 font-bold text-[9px]">42 Points</span>
            </div>
            <div className="p-2 rounded-xl bg-white border-2 border-charcoal text-center space-y-0.5 shadow-hard-xs">
              <span className="text-charcoal-muted font-mono block">Layer 2</span>
              <span className="font-bold text-charcoal block">Gemma Visual</span>
              <span className="text-purple-800 font-bold text-[9px]">
                {multimodalResult?.multimodal_mode === 'vision' ? 'Multimodal' : 'Geometric'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white border-2 border-charcoal text-center space-y-0.5 shadow-hard-xs">
              <span className="text-charcoal-muted font-mono block">Latency</span>
              <span className="font-bold text-charcoal block">
                {Math.round(multimodalResult?.execution_time_ms || 0)} ms
              </span>
              <span className="text-charcoal-muted text-[9px]">Apple Silicon</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-charcoal-muted flex items-center space-x-1">
              <HelpCircle className="w-3 h-3" />
              <span>Gemma assists recognition; human review is preserved.</span>
            </span>
            <button
              onClick={() => openFeedbackModal(currentLabel)}
              className="text-xs font-bold text-charcoal hover:underline flex items-center space-x-1"
            >
              <span>Submit Human Review</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
