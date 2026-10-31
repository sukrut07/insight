import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchLanguageVocabulary } from '../services/api';
import { SignLanguageId, SignReferenceItem } from '../types';
import { SignLanguageSelector } from '../components/SignLanguageSelector';
import { SignIllustration } from '../components/SignIllustration';
import { SignPracticePanel } from '../components/SignPracticePanel';
import {
  GraduationCap,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Eye,
  Award,
  BookOpen,
} from 'lucide-react';

export const SignLearningCentre: React.FC = () => {
  const {
    activeLanguage,
    currentLabel,
    confidence,
    isStable,
    handsDetected,
    leftHand,
    rightHand,
    annotatedFrame,
    visualIdentification,
  } = useStore();

  const [vocabulary, setVocabulary] = useState<SignReferenceItem[]>([]);
  const [selectedSign, setSelectedSign] = useState<SignReferenceItem | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);

  useEffect(() => {
    fetchLanguageVocabulary(activeLanguage)
      .then((data) => {
        if (data?.vocabulary) {
          setVocabulary(data.vocabulary);
          if (!selectedSign && data.vocabulary.length > 0) {
            setSelectedSign(data.vocabulary[0]);
          }
        }
      })
      .catch((err) => console.warn('Could not load vocabulary:', err));
  }, [activeLanguage]);

  if (isPracticing && selectedSign) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignPracticePanel
          sign={selectedSign}
          language={activeLanguage}
          onBack={() => setIsPracticing(false)}
        />
      </div>
    );
  }

  // Visual Identification Status
  const isRecognized = currentLabel !== 'NONE' && currentLabel !== 'UNKNOWN' && confidence >= 0.60;
  const isUncertain = currentLabel !== 'NONE' && confidence < 0.60;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="neo-card bg-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="neo-pill bg-pastel-mint text-charcoal text-xs font-bold">
                Learning Centre
              </span>
              <span className="text-xs font-mono text-charcoal-muted">
                Interactive Practice & Landmarks
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display text-charcoal tracking-tight">
              Sign Learning & Practice.
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl">
              Master gestures with live MediaPipe Holistic feedback and Google Gemma 4 linguistic reasoning.
            </p>
          </div>

          <SignLanguageSelector />
        </div>
      </div>

      {/* Visual Identification Mode Banner */}
      <div className="neo-card bg-pastel-mint p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-charcoal">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-charcoal" />
            <h2 className="text-sm font-bold text-charcoal font-display">Live Perception Status</h2>
            <span className="neo-pill bg-white text-charcoal text-[10px] font-bold">
              MediaPipe Stream
            </span>
          </div>

          <span
            className={`neo-pill text-xs font-bold ${
              isRecognized
                ? 'bg-white text-emerald-800'
                : isUncertain
                ? 'bg-pastel-yellow text-charcoal'
                : 'bg-cream-100 text-charcoal-muted'
            }`}
          >
            Status: {isRecognized ? '✓ Recognized' : isUncertain ? '⚡ Uncertain' : 'Searching...'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-white p-3 rounded-xl border-2 border-charcoal shadow-hard-xs">
            <span className="text-charcoal-muted block mb-0.5">Language:</span>
            <span className="text-charcoal font-bold text-sm">{activeLanguage}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border-2 border-charcoal shadow-hard-xs">
            <span className="text-charcoal-muted block mb-0.5">Hands:</span>
            <span className="text-charcoal font-bold text-sm">
              {handsDetected} ({leftHand ? 'L' : ''}{rightHand ? 'R' : ''}{!leftHand && !rightHand ? 'None' : ''})
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border-2 border-charcoal shadow-hard-xs">
            <span className="text-charcoal-muted block mb-0.5">Classifier Sign:</span>
            <span className="text-charcoal font-bold text-sm">{currentLabel}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border-2 border-charcoal shadow-hard-xs">
            <span className="text-charcoal-muted block mb-0.5">Confidence:</span>
            <span className="text-emerald-700 font-bold text-sm">{Math.round(confidence * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Sign Practice Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Sign Selection Carousel / List */}
        <div className="lg:col-span-4 neo-card bg-white p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-charcoal">
            <h3 className="text-xs font-bold text-charcoal font-display uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{activeLanguage} Vocabulary ({vocabulary.length})</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {vocabulary.map((sign) => {
              const isSelected = selectedSign?.id === sign.id;
              return (
                <button
                  key={sign.id}
                  type="button"
                  onClick={() => setSelectedSign(sign)}
                  className={`w-full text-left p-3 rounded-2xl transition-all border-2 border-charcoal flex items-center justify-between shadow-hard-xs ${
                    isSelected
                      ? 'bg-pastel-yellow text-charcoal font-black'
                      : 'bg-white hover:bg-cream-100 text-charcoal'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">{sign.label.replace('_', ' ')}</span>
                    <span className="text-[10px] text-charcoal-muted font-mono">
                      {sign.hands === 2 ? '2 Hands' : '1 Hand'} • {sign.type}
                    </span>
                  </div>
                  <PlayCircle className={`w-4 h-4 ${isSelected ? 'text-charcoal' : 'text-charcoal/40'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Sign Deep-Dive Card */}
        {selectedSign && (
          <div className="lg:col-span-8 neo-card bg-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-charcoal">
              <div>
                <span className="neo-pill bg-pastel-yellow text-charcoal text-[10px] font-bold uppercase">
                  {selectedSign.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-display text-charcoal tracking-tight mt-1">
                  {selectedSign.label.replace('_', ' ')}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsPracticing(true)}
                className="neo-btn bg-pastel-mint hover:bg-pastel-yellow text-charcoal px-6 py-3 text-xs font-bold flex items-center space-x-2"
              >
                <Target className="w-4 h-4" />
                <span>Start Interactive Camera Practice</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex justify-center p-4 bg-cream-100 rounded-3xl border-2 border-charcoal">
                <SignIllustration
                  label={selectedSign.label}
                  language={activeLanguage}
                  hands={selectedSign.hands}
                  type={selectedSign.type}
                  size="lg"
                />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-cream-100 border-2 border-charcoal rounded-2xl">
                  <h4 className="text-xs font-mono font-bold text-charcoal uppercase tracking-wider mb-1">
                    Linguistic Execution
                  </h4>
                  <p className="text-xs text-charcoal leading-relaxed">
                    {selectedSign.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-cream-100 border-2 border-charcoal rounded-xl">
                    <span className="text-charcoal-muted block mb-0.5 text-[10px] font-bold">Orientation</span>
                    <span className="text-charcoal font-semibold">{selectedSign.hand_orientation || 'Natural'}</span>
                  </div>

                  <div className="p-3 bg-cream-100 border-2 border-charcoal rounded-xl">
                    <span className="text-charcoal-muted block mb-0.5 text-[10px] font-bold">Start Position</span>
                    <span className="text-charcoal font-semibold">{selectedSign.start_position || 'Chest height'}</span>
                  </div>
                </div>

                <div className="p-3 bg-pastel-mint/50 border-2 border-charcoal rounded-xl text-xs text-charcoal flex items-start space-x-2">
                  <Award className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" />
                  <span>
                    Mastering this sign trains both single and dual hand articulation in {activeLanguage}.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
