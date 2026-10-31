import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useCamera } from '../hooks/useCamera';
import { useRecognitionWebSocket } from '../hooks/useRecognitionWebSocket';
import { speakText, orchestrateTranslation } from '../services/api';
import { SignLanguageSelector } from '../components/SignLanguageSelector';
import { CameraPermissionDialog } from '../components/CameraPermissionDialog';
import {
  MessageSquare,
  Send,
  Volume2,
  Trash2,
  Sparkles,
  Camera,
  Play,
  Pause,
  RotateCcw,
  FlipHorizontal,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { SignLanguageId } from '../types';

interface ChatMessage {
  id: string;
  sender: 'signer' | 'partner';
  senderName: string;
  text: string;
  glosses?: string[];
  timestamp: string;
  language?: SignLanguageId;
  verified?: boolean;
}

export const ConnectPage: React.FC = () => {
  const {
    activeLanguage,
    setActiveLanguage,
    currentLabel,
    confidence,
    isStable,
    handsDetected,
    sentenceTokens,
    addToken,
    clearTokens,
    removeToken,
    isPaused,
    setIsPaused,
    accessibility,
  } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'signer',
      senderName: 'Signer (ISL)',
      text: 'Hello! Welcome to iNSIGHT Connect.',
      glosses: ['HELLO'],
      timestamp: 'Just now',
      language: 'ISL',
      verified: true,
    },
    {
      id: 'm2',
      sender: 'partner',
      senderName: 'Hearing Partner',
      text: 'Hi! Nice to meet you. I am ready to converse.',
      timestamp: 'Just now',
    },
  ]);

  const [partnerInput, setPartnerInput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Camera & recognition pipeline
  const {
    status: cameraStatus,
    devices,
    selectedDeviceId,
    error: cameraError,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    isActive: isCamActive,
  } = useCamera({
    onFrame: (b64) => {
      if (!isPaused && isCamActive) {
        sendFrame(b64);
      }
    },
    targetFps: 25,
    autoStart: false,
  });

  const { sendFrame, resetBuffer } = useRecognitionWebSocket();

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePartnerSend = (textToSend?: string) => {
    const text = (textToSend || partnerInput).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: 'partner',
      senderName: 'Hearing Partner',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setPartnerInput('');
  };

  const handleSignerConfirmAndSend = async () => {
    if (!sentenceTokens.length) return;
    setIsTranslating(true);

    try {
      const res = await orchestrateTranslation({
        language: activeLanguage,
        signs: sentenceTokens.map((t) => ({
          word: t.word,
          confidence: t.confidence,
        })),
      });
      const translatedText = res.readable_translation || sentenceTokens.map((t) => t.word).join(' ');

      const newMsg: ChatMessage = {
        id: `m_${Date.now()}`,
        sender: 'signer',
        senderName: `Signer (${activeLanguage})`,
        text: translatedText,
        glosses: sentenceTokens.map((t) => t.word),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: activeLanguage,
        verified: !res.requires_user_confirmation,
      };

      setMessages((prev) => [...prev, newMsg]);
      clearTokens();
      resetBuffer();

      // Speak aloud if enabled in settings
      if (accessibility.speechOutput) {
        speakText(translatedText);
      }
    } catch (err) {
      console.error('Translation error:', err);
      // Fallback
      const fallbackText = sentenceTokens.map((t) => t.word).join(' ');
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          sender: 'signer',
          senderName: `Signer (${activeLanguage})`,
          text: fallbackText,
          glosses: sentenceTokens.map((t) => t.word),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: activeLanguage,
          verified: false,
        },
      ]);
      clearTokens();
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    speakText(text);
  };

  const quickReplies = [
    'Hello! Nice to meet you.',
    'Could you repeat that sign?',
    'I understand clearly.',
    'Thank you so much!',
    'How can I help you?',
  ];

  return (
    <div className="min-h-screen bg-[#F8F6EF] text-[#242424] font-sans pb-16">
      {/* Top Banner Header */}
      <div className="border-b-2 border-[#242424] bg-white px-6 py-6 shadow-[0_4px_0px_#242424]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C8E9F7] border-2 border-[#242424] rounded-full text-xs font-black tracking-wider uppercase shadow-[2px_2px_0px_#242424] mb-2">
              <Users className="w-3.5 h-3.5" /> Two-Person Workspace
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#242424]">
              iNSIGHT Connect
            </h1>
            <p className="text-sm font-semibold text-[#555] mt-0.5">
              Natural bidirectional conversation between Deaf signers and hearing non-signers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SignLanguageSelector />
            <button
              onClick={() => setMessages([])}
              className="px-3.5 py-2 bg-white border-2 border-[#242424] rounded-xl font-bold text-xs shadow-[2px_2px_0px_#242424] hover:bg-[#F8CFD0] transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Split Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Signer Workspace (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white border-2 border-[#242424] rounded-2xl p-5 shadow-[4px_4px_0px_#242424]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#242424]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#CDEFD4] border border-[#242424]" />
                  <span className="font-black text-sm uppercase tracking-wide">
                    Signer Camera ({activeLanguage})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    title="Flip Mirror"
                    className="p-1.5 bg-[#F8F6EF] border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] hover:bg-[#C8E9F7] text-xs font-bold"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1.5 bg-[#F8F6EF] border-2 border-[#242424] rounded-lg shadow-[2px_2px_0px_#242424] hover:bg-[#F9E9B7] text-xs font-bold"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Camera Video View */}
              <div className="relative aspect-video bg-[#242424] rounded-xl overflow-hidden border-2 border-[#242424] shadow-[inner_0_2px_4px_rgba(0,0,0,0.3)]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''}`}
                />

                {!isCamActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F8F6EF] p-4 text-center">
                    <Camera className="w-10 h-10 text-[#242424] mb-2" />
                    <p className="font-bold text-sm mb-3">Camera is currently paused.</p>
                    <button
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-[#CDEFD4] border-2 border-[#242424] rounded-xl font-black text-xs shadow-[2px_2px_0px_#242424] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#242424] transition"
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {/* Real-Time Recognition Overlay HUD */}
                {isCamActive && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="px-3 py-1.5 bg-white/95 border-2 border-[#242424] rounded-xl shadow-[2px_2px_0px_#242424] flex items-center gap-2">
                      <span className="text-xs font-bold text-[#555]">Sign:</span>
                      <span className="font-black text-sm text-[#242424]">
                        {currentLabel !== 'NONE' ? currentLabel : 'Waiting for gesture...'}
                      </span>
                      {confidence > 0 && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-[#CDEFD4] border border-[#242424] rounded-md">
                          {Math.round(confidence * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="px-2.5 py-1 bg-white/95 border-2 border-[#242424] rounded-xl shadow-[2px_2px_0px_#242424] text-[10px] font-black uppercase">
                      {handsDetected > 0 ? `${handsDetected} Hand(s)` : 'No hands'}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Recognized Tokens Buffer */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#555]">
                    Detected Signs Buffer
                  </span>
                  {sentenceTokens.length > 0 && (
                    <button
                      onClick={clearTokens}
                      className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear Buffer
                    </button>
                  )}
                </div>

                <div className="min-h-[56px] p-2.5 bg-[#F8F6EF] border-2 border-[#242424] rounded-xl flex flex-wrap gap-2 items-center">
                  {sentenceTokens.length === 0 ? (
                    <span className="text-xs font-semibold text-[#888] italic px-1">
                      Perform signs in front of the camera to queue words...
                    </span>
                  ) : (
                    sentenceTokens.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#242424] rounded-lg text-xs font-black shadow-[2px_2px_0px_#242424]"
                      >
                        {t.word}
                        <button
                          onClick={() => removeToken(idx)}
                          className="hover:text-red-500 font-bold ml-0.5 text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <button
                  onClick={handleSignerConfirmAndSend}
                  disabled={sentenceTokens.length === 0 || isTranslating}
                  className={`mt-3 w-full py-3 border-2 border-[#242424] rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-[3px_3px_0px_#242424] transition ${
                    sentenceTokens.length > 0 && !isTranslating
                      ? 'bg-[#CDEFD4] hover:bg-[#bbf0c5] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#242424]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {isTranslating ? 'Translating via Gemma...' : 'Translate & Send Message'}
                </button>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-[#E8DDFB] border-2 border-[#242424] rounded-2xl p-4 shadow-[3px_3px_0px_#242424]">
              <h4 className="font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Signer Tips
              </h4>
              <p className="text-xs font-semibold text-[#333] leading-relaxed">
                Hold signs steady for ~0.8s. In Indian Sign Language (ISL), grammar follows Subject-Object-Verb (SOV) order.
                Gemma 4 E4B reconstructs full natural English before posting.
              </p>
            </div>
          </div>

          {/* RIGHT: Conversation Thread & Hearing Partner Workspace (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-[700px] bg-white border-2 border-[#242424] rounded-2xl shadow-[4px_4px_0px_#242424] overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-3.5 border-b-2 border-[#242424] bg-[#F8F6EF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#242424]" />
                <span className="font-black text-xs uppercase tracking-wider">
                  Live Conversation Transcript
                </span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-white border border-[#242424] rounded-full shadow-[1px_1px_0px_#242424]">
                {messages.length} messages
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8F6EF]/30">
              {messages.map((msg) => {
                const isSigner = msg.sender === 'signer';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSigner ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-black text-[#666]">
                      <span>{msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.verified && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-[#CDEFD4] px-1.5 py-0.2 rounded border border-[#242424] text-[9px]">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 border-2 border-[#242424] shadow-[3px_3px_0px_#242424] ${
                        isSigner
                          ? 'bg-[#CDEFD4] text-[#242424]'
                          : 'bg-[#C8E9F7] text-[#242424]'
                      }`}
                    >
                      {/* Original Sign Tokens if present */}
                      {msg.glosses && msg.glosses.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {msg.glosses.map((g, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-black uppercase px-2 py-0.5 bg-white/80 border border-[#242424] rounded-md"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="font-bold text-sm leading-relaxed">{msg.text}</p>

                      {/* Message Actions */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#242424]/20 justify-end">
                        <button
                          onClick={() => handleSpeak(msg.text)}
                          title="Speak Message"
                          className="p-1 hover:bg-white/50 rounded transition"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-[#242424]" />
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Copy Text"
                          className="p-1 hover:bg-white/50 rounded transition"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#242424]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Replies Bar */}
            <div className="px-4 py-2 bg-white border-t-2 border-[#242424] overflow-x-auto flex gap-2">
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePartnerSend(qr)}
                  className="whitespace-nowrap px-3 py-1 bg-[#F8F6EF] border border-[#242424] rounded-lg text-xs font-bold hover:bg-[#F9E9B7] transition"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Partner Text Input Bar */}
            <div className="p-4 bg-white border-t-2 border-[#242424]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePartnerSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={partnerInput}
                  onChange={(e) => setPartnerInput(e.target.value)}
                  placeholder="Type reply as hearing partner..."
                  className="flex-1 px-4 py-3 bg-[#F8F6EF] border-2 border-[#242424] rounded-xl font-bold text-sm outline-none focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!partnerInput.trim()}
                  className={`px-5 py-3 border-2 border-[#242424] rounded-xl font-black text-sm flex items-center gap-1.5 shadow-[2px_2px_0px_#242424] transition ${
                    partnerInput.trim()
                      ? 'bg-[#C8E9F7] hover:bg-[#aee1f5] hover:translate-y-0.5'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
