import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SignReferenceItem, SignLanguageId } from '../types';
import { SignIllustration } from './SignIllustration';
import { CheckCircle2, AlertTriangle, ArrowLeft, RotateCcw, Target, Sparkles, Volume2 } from 'lucide-react';
import { speakText } from '../services/api';

interface SignPracticePanelProps {
  sign: SignReferenceItem;
  language: SignLanguageId;
  onBack: () => void;
}

export const SignPracticePanel: React.FC<SignPracticePanelProps> = ({
  sign,
  language,
  onBack,
}) => {
  const { currentLabel, confidence, isStable, annotatedFrame, handsDetected } = useStore();
  const [matchProgress, setMatchProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Compare live prediction with practice target
  const isMatching = currentLabel === sign.label && confidence >= 0.60;

  useEffect(() => {
    let timer: number;
    if (isMatching && isStable) {
      timer = window.setInterval(() => {
        setMatchProgress((prev) => {
          if (prev >= 100) {
            setIsSuccess(true);
            return 100;
          }
          return prev + 25;
        });
      }, 200);
    } else {
      setMatchProgress((prev) => Math.max(0, prev - 10));
    }

    return () => {
      clearInterval(timer);
    };
  }, [isMatching, isStable]);

  const handleHearWord = () => {
    speakText(sign.label.replace('_', ' '));
  };

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-fade-in max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-500">Practice Mode:</span>
          <span className="font-bold text-brand-cyan">{language}</span>
          <span>•</span>
          <span className="text-slate-300 font-bold">{sign.label.replace('_', ' ')}</span>
        </div>

        <button
          type="button"
          onClick={handleHearWord}
          className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Speak sign"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Left: Target Reference Guide */}
        <div className="space-y-4">
          <div className="bg-dark-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center">
            <span className="text-xs font-mono uppercase text-brand-cyan mb-1">
              Target Gesture
            </span>
            <h2 className="text-2xl font-black text-white mb-4 tracking-wide">
              {sign.label.replace('_', ' ')}
            </h2>

            <SignIllustration
              label={sign.label}
              language={language}
              hands={sign.hands}
              type={sign.type}
              size="lg"
            />

            <div className="mt-4 w-full text-xs text-slate-300 space-y-2 bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <p className="font-medium text-slate-200">{sign.description}</p>
              <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 block">Orientation:</span>
                  <span className="text-slate-300 font-mono">{sign.hand_orientation || 'Natural'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Required Hands:</span>
                  <span className="text-slate-300 font-mono">{sign.hands === 2 ? 'Both Hands' : '1 Hand'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Camera Match Monitor */}
        <div className="space-y-4">
          <div className="relative bg-dark-950 border border-slate-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
            {annotatedFrame ? (
              <img
                src={annotatedFrame}
                alt="Live Camera with MediaPipe Holistic Landmarks"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-40 animate-pulse" />
                <p className="text-sm font-medium">Waiting for video stream...</p>
                <p className="text-xs text-slate-600 mt-1">Make sure camera is enabled.</p>
              </div>
            )}

            {/* Overlaid Match Status */}
            <div className="absolute top-3 left-3 bg-dark-950/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 flex items-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
              <span className="text-slate-400">Live Prediction:</span>
              <span className="font-bold text-white font-mono">{currentLabel}</span>
              <span className="text-slate-400">({Math.round(confidence * 100)}%)</span>
            </div>

            {/* Success Overlay */}
            {isSuccess && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-3 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-1">Gesture Mastered!</h3>
                <p className="text-xs text-emerald-200 max-w-sm mb-4">
                  Accurate posture and movement verified by dedicated {language} recognition pipeline.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setMatchProgress(0);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-dark-950 font-semibold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Practice Again</span>
                </button>
              </div>
            )}
          </div>

          {/* Real-time Match Feedback Gauge */}
          <div className="bg-dark-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Gesture Match Accuracy</span>
              <span className="font-mono text-brand-cyan font-bold">{matchProgress}%</span>
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  matchProgress > 75
                    ? 'bg-emerald-400'
                    : matchProgress > 30
                    ? 'bg-brand-cyan'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${matchProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-2 text-center">
              {isMatching
                ? 'Great! Hold the posture steady for 2 seconds to complete verification.'
                : handsDetected === 0
                ? 'Position your hand(s) inside the camera frame.'
                : `Current gesture detected as "${currentLabel}". Adjust hand orientation to match reference.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
