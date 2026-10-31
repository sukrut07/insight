import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { refineTranslation, speakText, stopSpeech, fetchVoices } from '../services/api';
import {
  Sparkles,
  Volume2,
  Square,
  Copy,
  Check,
  Languages,
  CheckCircle2,
  XCircle,
  Settings2,
} from 'lucide-react';

export const TranslationEditor: React.FC = () => {
  const {
    sentenceTokens,
    refinedTranslation,
    setRefinedTranslation,
    isRefining,
    setIsRefining,
  } = useStore();

  const [currentText, setCurrentText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<{ name: string; locale: string }[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('Samantha');
  const [speechRate, setSpeechRate] = useState(175);

  useEffect(() => {
    fetchVoices()
      .then((v) => {
        setVoices(v);
        if (v.length > 0) setSelectedVoice(v[0].name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (refinedTranslation?.refined_sentence) {
      setCurrentText(refinedTranslation.refined_sentence);
    } else if (sentenceTokens.length > 0) {
      setCurrentText(sentenceTokens.map((t) => t.word).join(' '));
    }
  }, [refinedTranslation, sentenceTokens]);

  const handleRefine = async () => {
    if (!currentText.trim() && sentenceTokens.length === 0) return;
    setIsRefining(true);
    try {
      const payload = sentenceTokens.length > 0
        ? sentenceTokens.map((t) => ({ word: t.word, confidence: t.confidence }))
        : currentText.split(' ').map((w) => ({ word: w, confidence: 1.0 }));

      const result = await refineTranslation(payload, customPrompt);
      setRefinedTranslation(result);
      setCurrentText(result.refined_sentence);
    } catch (err) {
      console.error('Refine failed:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSpeak = async () => {
    if (!currentText.trim()) return;
    setIsPlaying(true);
    try {
      await speakText(currentText, selectedVoice, speechRate);
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleStop = async () => {
    await stopSpeech();
    setIsPlaying(false);
  };

  const handleCopy = () => {
    if (!currentText) return;
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyAlternative = (alt: string) => {
    setCurrentText(alt);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
          <Languages className="w-6 h-6 text-brand-cyan" />
          <span>Translation & Speech Studio</span>
        </h2>
        <p className="text-xs text-slate-400">
          Refine raw ISL gestures into expressive English sentences using local Gemma 4 and listen with macOS speech synthesis.
        </p>
      </div>

      {/* Main Translation Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <span>Translated Output</span>
            {refinedTranslation && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                Model: {refinedTranslation.model_used}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              disabled={!currentText}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Editable Translation Textarea */}
        <textarea
          rows={4}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Recognized translation will appear here. You can manually edit or adjust prior to speaking..."
          className="w-full bg-dark-900 border border-slate-700/80 rounded-xl p-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan transition-all resize-none font-medium leading-relaxed"
        />

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          {/* TTS Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSpeak}
              disabled={!currentText.trim() || isPlaying}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:brightness-110 disabled:opacity-40 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlaying ? 'Playing...' : 'Speak Translation'}</span>
            </button>

            {isPlaying && (
              <button
                onClick={handleStop}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-rose-400 hover:bg-slate-800"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            )}
          </div>

          {/* AI Refine Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefine}
              disabled={isRefining}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-teal-500 text-dark-950 font-bold text-xs shadow-md shadow-brand-cyan/20 hover:brightness-110 disabled:opacity-40 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRefining ? 'Gemma 4 Processing...' : 'Re-structure with Gemma 4'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestions & Alternatives */}
      {refinedTranslation && refinedTranslation.alternatives.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>AI Suggested Variations</span>
          </h3>

          <div className="space-y-2">
            {refinedTranslation.alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-dark-900 border border-slate-800/80 flex items-center justify-between text-xs text-slate-200 hover:border-brand-cyan/40 transition-all"
              >
                <span className="font-medium italic">"{alt}"</span>
                <button
                  onClick={() => applyAlternative(alt)}
                  className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-brand-cyan hover:text-dark-950 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-all"
                >
                  Use This
                </button>
              </div>
            ))}
          </div>

          {refinedTranslation.notes && (
            <p className="text-[11px] text-slate-400 italic pt-1">
              Note: {refinedTranslation.notes}
            </p>
          )}
        </div>
      )}

      {/* Audio Engine Configuration Settings */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <span>Speech Engine Settings (macOS Native Offline)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Voice Selection</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
            >
              {voices.slice(0, 30).map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.locale})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Speech Rate ({speechRate} WPM)</span>
            </div>
            <input
              type="range"
              min="120"
              max="240"
              value={speechRate}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
              className="w-full accent-brand-cyan bg-dark-900 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
