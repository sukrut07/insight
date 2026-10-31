import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { sendChatMessage } from '../services/api';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Bot,
  User,
  HelpCircle,
  Minimize2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  latency_ms?: number;
  timestamp: string;
  isError?: boolean;
}

export const GeminiChatbot: React.FC = () => {
  const { activeLanguage } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `Hello! I'm your INSIGHT Sign Language Assistant. Ask me anything about Indian Sign Language (ISL), British Sign Language (BSL), or American Sign Language (ASL). I can help you with sign descriptions, hand orientation, camera troubleshooting, and practice advice.`,
      provider: 'gemini_api',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'How do I sign "Hello" in ISL?',
    'Why was my sign not recognized?',
    'Difference between ISL and ASL alphabet?',
    'Tips for better camera tracking',
  ];

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: text,
        conversation_history: history,
        language_context: activeLanguage,
        allow_cloud: true,
      });

      if (res.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: res.response || 'Connection error. Please verify your settings and retry.',
            isError: true,
            provider: res.provider || 'gemini_api',
            latency_ms: res.latency_ms,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            role: 'assistant',
            content: res.response,
            provider: res.provider || 'gemini_api',
            latency_ms: res.latency_ms,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Unable to communicate with the AI language service. Please check your network or try again.',
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (lastUserPrompt: string) => {
    handleSend(lastUserPrompt);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="insight-chatbot-toggle"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-pastel-mint text-charcoal border-2 border-charcoal rounded-2xl shadow-hard-md hover:-translate-y-1 hover:shadow-hard-lg transition-all focus:outline-hidden"
          title="Open iNSIGHT Sign Assistant"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-charcoal flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-charcoal" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black font-display uppercase tracking-wider text-charcoal">
              AI Sign Assistant
            </div>
            <div className="text-[10px] text-charcoal-muted font-mono">Gemini & Gemma 4</div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="insight-chatbot-modal"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[85vh] h-[580px] bg-surface border-2 border-charcoal rounded-3xl shadow-hard-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="bg-cream-100 border-b-2 border-charcoal px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-pastel-mint border-2 border-charcoal flex items-center justify-center shadow-hard-xs">
                <Bot className="w-4 h-4 text-charcoal" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-extrabold text-charcoal font-display">iNSIGHT Assistant</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-pastel-yellow border border-charcoal rounded font-bold">
                    {activeLanguage}
                  </span>
                </div>
                <p className="text-[10px] text-charcoal-muted">Google Gemini + Multimodal Reasoning</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg border border-charcoal bg-white hover:bg-pastel-pink transition-colors text-charcoal"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-cream-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border-2 border-charcoal shadow-hard-xs ${
                    m.role === 'user'
                      ? 'bg-pastel-blue text-charcoal font-medium'
                      : m.isError
                      ? 'bg-pastel-pink text-charcoal'
                      : 'bg-white text-charcoal'
                  }`}
                >
                  {m.isError && (
                    <div className="flex items-center space-x-1.5 mb-1.5 font-bold text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Connection Notice</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.isError && (
                    <button
                      onClick={() => {
                        const lastUser = [...messages].reverse().find((x) => x.role === 'user');
                        if (lastUser) handleRetry(lastUser.content);
                      }}
                      className="mt-2.5 inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-charcoal rounded-lg font-bold hover:bg-cream-100 transition-colors text-[10px]"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-2 mt-1 px-1 text-[9px] font-mono text-charcoal-muted">
                  <span>{m.timestamp}</span>
                  {m.provider && <span>• {m.provider}</span>}
                  {m.latency_ms && <span>• {m.latency_ms}ms</span>}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 p-3 bg-white border-2 border-charcoal rounded-2xl shadow-hard-xs w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-charcoal" />
                <span className="text-xs font-mono text-charcoal-muted">Consulting sign intelligence...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="bg-cream-100 border-t border-charcoal/20 px-3 py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="shrink-0 text-[10px] font-medium px-2.5 py-1 bg-white border border-charcoal rounded-full hover:bg-pastel-lavender transition-colors disabled:opacity-50 text-charcoal"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t-2 border-charcoal flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about a sign, hand shape, or camera issue..."
              disabled={isLoading}
              className="flex-1 bg-cream-50 border-2 border-charcoal rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:bg-white text-charcoal placeholder:text-charcoal-muted/60"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-pastel-mint text-charcoal border-2 border-charcoal rounded-xl shadow-hard-xs hover:-translate-y-0.5 hover:shadow-hard-sm transition-all disabled:opacity-40 disabled:hover:translate-y-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
