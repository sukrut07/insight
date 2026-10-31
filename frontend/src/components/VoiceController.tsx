import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceControllerProps {
  currentTranslation?: string;
  onVoiceTranscript?: (transcript: string) => void;
  className?: string;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  currentTranslation = '',
  onVoiceTranscript,
  className = '',
}) => {
  // Speech Synthesis state (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Speech Recognition state (STT)
  const {
    isSupported: sttSupported,
    isListening,
    isProcessing,
    transcript,
    error: sttError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: 'en-IN',
    onResult: (text, isFinal) => {
      if (isFinal && onVoiceTranscript) {
        onVoiceTranscript(text);
      }
    },
  });

  // Load available browser synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoice) {
          const defaultVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
          setSelectedVoice(defaultVoice.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !currentTranslation.trim()) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTranslation);
    utterance.rate = speechRate;
    if (selectedVoice) {
      const voiceObj = availableVoices.find((v) => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Voice & Speech Controls"
      className={`bg-[#FFFFFF] border-2 border-[#242424] rounded-xl p-4 shadow-[3px_3px_0px_#242424] space-y-4 ${className}`}
    >
      {/* Header and Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#242424]/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#CDEFD4] border-2 border-[#242424] rounded-lg">
            <Radio className="w-4 h-4 text-[#242424]" />
          </div>
          <div>
            <h4 className="font-black text-sm text-[#242424] tracking-tight">Bidirectional Voice Engine</h4>
            <p className="text-xs text-[#242424]/70">Speech Synthesis (TTS) & Voice Input (STT)</p>
          </div>
        </div>

        {/* Dynamic Status Badges */}
        <div className="flex items-center gap-1.5">
          {isListening && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8CFD0] border-2 border-[#242424] rounded-full text-xs font-black animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#E5484D]" />
              LISTENING
            </span>
          )}
          {isSpeaking && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#C8E9F7] border-2 border-[#242424] rounded-full text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-[#0091FF] animate-ping" />
              {isPaused ? 'PAUSED' : 'SPEAKING'}
            </span>
          )}
          {isProcessing && (
            <span className="px-2.5 py-1 bg-[#F9E9B7] border-2 border-[#242424] rounded-full text-xs font-black">
              PROCESSING...
            </span>
          )}
          {sttError === 'not-allowed' && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-[#F8CFD0] border-2 border-[#242424] rounded-full text-xs font-bold text-[#E5484D]">
              <AlertCircle className="w-3.5 h-3.5" />
              MIC DENIED
            </span>
          )}
          {!sttSupported && (
            <span className="px-2.5 py-1 bg-gray-200 border-2 border-[#242424] rounded-full text-xs font-bold text-gray-700">
              STT UNSUPPORTED
            </span>
          )}
        </div>
      </div>

      {/* Row 1: Text-to-Speech Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#242424]/80">
          <span>Read Translation Aloud</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-500">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setSpeechRate(rate)}
                className={`px-1.5 py-0.5 text-[11px] rounded border font-mono font-bold transition-all ${
                  speechRate === rate
                    ? 'bg-[#242424] text-white border-[#242424]'
                    : 'bg-gray-100 text-[#242424] border-gray-300 hover:bg-gray-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSpeaking || isPaused ? (
            <button
              type="button"
              onClick={handleSpeak}
              disabled={!currentTranslation.trim()}
              aria-label="Speak translation aloud"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#CDEFD4] hover:bg-[#bce5c4] text-[#242424] font-black text-xs border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Volume2 className="w-4 h-4" />
              {isPaused ? 'Resume Speech' : 'Speak Translation'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              aria-label="Pause speech playback"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#F9E9B7] hover:bg-[#eddca0] text-[#242424] font-black text-xs border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Pause className="w-4 h-4" />
              Pause Speech
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={!isSpeaking && !isPaused}
            aria-label="Stop speech playback"
            className="p-2 bg-gray-100 hover:bg-gray-200 border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] disabled:opacity-30 disabled:cursor-not-allowed active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <VolumeX className="w-4 h-4 text-[#242424]" />
          </button>
        </div>
      </div>

      {/* Row 2: Speech-to-Text Voice Input for Hearing Partner */}
      <div className="space-y-2 border-t-2 border-[#242424]/10 pt-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#242424]/80">
          <span>Hearing Partner Voice Input</span>
          <span className="text-[11px] text-gray-500">Transcribes to Deaf Signer</span>
        </div>

        <div className="flex items-center gap-2">
          {!isListening ? (
            <button
              type="button"
              onClick={startListening}
              disabled={!sttSupported}
              aria-label="Start voice input"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#E8DDFB] hover:bg-[#dccefa] text-[#242424] font-black text-xs border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Mic className="w-4 h-4 text-[#242424]" />
              Start Speaking (Hearing Partner)
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              aria-label="Stop voice input"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#F8CFD0] hover:bg-[#ecc0c2] text-[#242424] font-black text-xs border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <MicOff className="w-4 h-4 text-[#E5484D]" />
              Stop Microphone
            </button>
          )}

          {transcript && (
            <button
              type="button"
              onClick={resetTranscript}
              aria-label="Clear voice transcript"
              className="p-2 bg-gray-100 hover:bg-gray-200 border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-[#242424]" />
            </button>
          )}
        </div>

        {/* Live Transcript Display Box */}
        {transcript && (
          <div className="bg-[#F8F6EF] border-2 border-[#242424] rounded-lg p-2.5 text-xs text-[#242424]">
            <span className="font-black text-[11px] uppercase tracking-wider text-purple-700 block mb-0.5">
              Spoken Transcript:
            </span>
            <p className="font-medium italic leading-relaxed">"{transcript}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
