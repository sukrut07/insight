import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SignLanguageId } from '../types';
import { API_BASE } from '../services/api';
import {
  BookOpen,
  Volume2,
  Search,
  Sparkles,
  Hand,
  CheckCircle2,
  ChevronRight,
  Filter,
  Eye,
  Camera,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AlphabetCard {
  letter: string;
  hands: number;
  description: string;
  orientation: string;
  tip?: string;
}

interface NumberCard {
  number: string;
  hands: number;
  description: string;
  orientation: string;
}

interface VocabularyCard {
  id: number;
  label: string;
  category: string;
  hands: number;
  description: string;
  hand_orientation?: string;
  start_position?: string;
  end_position?: string;
}

export const SignWorkbook: React.FC = () => {
  const { activeLanguage, setActiveLanguage, setActiveTab } = useStore();
  const [activeCategory, setActiveCategory] = useState<'alphabet' | 'numbers' | 'vocabulary'>('alphabet');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<AlphabetCard | null>(null);
  const [filterHands, setFilterHands] = useState<'all' | '1' | '2'>('all');

  const [alphabets, setAlphabets] = useState<AlphabetCard[]>([]);
  const [numbers, setNumbers] = useState<NumberCard[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch language data from backend API
  useEffect(() => {
    const fetchLanguageData = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE}/languages/${activeLanguage.toLowerCase()}/config`);
        if (resp.ok) {
          const data = await resp.json();
          setAlphabets(data.alphabet || []);
          setNumbers(data.numbers || []);
          setVocabulary(data.vocabulary || []);
          if (data.alphabet && data.alphabet.length > 0) {
            setSelectedLetter(data.alphabet[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load workbook data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguageData();
  }, [activeLanguage]);

  // Audio speech synthesis helper
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredAlphabets = alphabets.filter((item) => {
    const matchesSearch =
      item.letter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHands =
      filterHands === 'all' ||
      (filterHands === '1' && item.hands === 1) ||
      (filterHands === '2' && item.hands === 2);
    return matchesSearch && matchesHands;
  });

  const filteredNumbers = numbers.filter((item) => {
    return (
      item.number.includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredVocabulary = vocabulary.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHands =
      filterHands === 'all' ||
      (filterHands === '1' && item.hands === 1) ||
      (filterHands === '2' && item.hands === 2);
    return matchesSearch && matchesHands;
  });

  const languageNames: Record<SignLanguageId, { name: string; flag: string; type: string }> = {
    ISL: { name: 'Indian Sign Language', flag: '🇮🇳', type: 'Two-Handed & Hybrid Fingerspelling' },
    ASL: { name: 'American Sign Language', flag: '🇺🇸', type: 'One-Handed Manual Alphabet' },
    BSL: { name: 'British Sign Language', flag: '🇬🇧', type: 'Two-Handed BANZSL Alphabet' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="neo-card p-6 sm:p-8 bg-gradient-to-r from-pastel-mint via-cream-50 to-pastel-yellow border-2 border-charcoal shadow-hard flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="neo-pill bg-white px-3 py-1 text-xs font-bold text-charcoal shadow-hard-xs flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-charcoal" />
              Interactive Study Workbook
            </span>
            <span className="neo-pill bg-pastel-lavender px-3 py-1 text-xs font-bold text-charcoal shadow-hard-xs">
              Complete A–Z & Basic Gestures
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-charcoal tracking-tight">
            Sign Language Workbook
          </h1>
          <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
            Master the complete manual alphabet (A–Z), numbers, and essential foundational signs with detailed hand configurations, palm orientations, and auditory pronunciation.
          </p>
        </div>

        {/* Practice in Lab Button */}
        <button
          onClick={() => setActiveTab('gesture-lab')}
          className="neo-btn bg-charcoal text-white hover:bg-black px-5 py-3 text-sm font-bold shadow-hard-sm flex items-center gap-2 group flex-shrink-0"
        >
          <Camera className="w-4 h-4 text-pastel-mint" />
          <span>Practice with Camera</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Language Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-charcoal/20 pb-4">
        <div className="flex items-center gap-2">
          {(['ISL', 'ASL', 'BSL'] as SignLanguageId[]).map((lang) => {
            const isSelected = activeLanguage === lang;
            return (
              <button
                key={lang}
                onClick={() => setActiveLanguage(lang)}
                className={`neo-pill px-4 py-2 text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-charcoal text-white shadow-hard-sm'
                    : 'bg-white text-charcoal hover:bg-cream-200'
                }`}
              >
                <span className="mr-1.5">{languageNames[lang].flag}</span>
                <span>{lang}</span>
                <span className="ml-2 text-xs opacity-75 hidden sm:inline">
                  ({languageNames[lang].name})
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-charcoal-muted font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pastel-mint" />
          <span>Active: <strong>{languageNames[activeLanguage].type}</strong></span>
        </div>
      </div>

      {/* Category Tabs & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveCategory('alphabet')}
            className={`neo-btn px-4 py-2 text-xs sm:text-sm font-bold ${
              activeCategory === 'alphabet'
                ? 'bg-pastel-mint text-charcoal shadow-hard-sm'
                : 'bg-white text-charcoal hover:bg-cream-100'
            }`}
          >
            Alphabet (A–Z) ({alphabets.length})
          </button>
          <button
            onClick={() => setActiveCategory('numbers')}
            className={`neo-btn px-4 py-2 text-xs sm:text-sm font-bold ${
              activeCategory === 'numbers'
                ? 'bg-pastel-yellow text-charcoal shadow-hard-sm'
                : 'bg-white text-charcoal hover:bg-cream-100'
            }`}
          >
            Numbers (1–10) ({numbers.length})
          </button>
          <button
            onClick={() => setActiveCategory('vocabulary')}
            className={`neo-btn px-4 py-2 text-xs sm:text-sm font-bold ${
              activeCategory === 'vocabulary'
                ? 'bg-pastel-lavender text-charcoal shadow-hard-sm'
                : 'bg-white text-charcoal hover:bg-cream-100'
            }`}
          >
            Basic Signs ({vocabulary.length})
          </button>
        </div>

        {/* Search & Hands Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-charcoal rounded-xl text-xs font-medium text-charcoal placeholder-charcoal-muted focus:outline-none focus:ring-2 focus:ring-charcoal"
            />
          </div>

          <select
            value={filterHands}
            onChange={(e) => setFilterHands(e.target.value as any)}
            className="bg-white border-2 border-charcoal rounded-xl px-3 py-1.5 text-xs font-bold text-charcoal focus:outline-none cursor-pointer"
          >
            <option value="all">All Hands</option>
            <option value="1">1-Handed</option>
            <option value="2">2-Handed</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="neo-card p-12 text-center text-charcoal-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-charcoal border-t-transparent mb-3" />
          <p className="text-sm font-bold">Loading {activeLanguage} workbook materials...</p>
        </div>
      ) : activeCategory === 'alphabet' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Grid: 26 Letter Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredAlphabets.map((item) => {
              const isSelected = selectedLetter?.letter === item.letter;
              return (
                <div
                  key={item.letter}
                  onClick={() => setSelectedLetter(item)}
                  className={`neo-card p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-pastel-mint ring-2 ring-charcoal shadow-hard'
                      : 'bg-white hover:bg-cream-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl font-black font-display text-charcoal">
                      {item.letter}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(item.letter);
                      }}
                      className="p-1 text-charcoal-muted hover:text-charcoal hover:bg-black/5 rounded-lg transition-colors"
                      title="Pronounce letter"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold border border-charcoal ${
                        item.hands === 1 ? 'bg-pastel-blue' : 'bg-pastel-pink'
                      }`}
                    >
                      {item.hands} {item.hands === 1 ? 'Hand' : 'Hands'}
                    </span>
                    <span className="text-charcoal-muted font-mono">{activeLanguage}</span>
                  </div>

                  <p className="mt-2 text-[11px] text-charcoal-muted line-clamp-2 leading-tight">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Detail Panel: Focused Letter Study Card */}
          <div className="lg:col-span-4 sticky top-6">
            {selectedLetter ? (
              <div className="neo-card p-6 bg-white border-2 border-charcoal shadow-hard space-y-6">
                <div className="flex items-center justify-between border-b-2 border-charcoal/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-2xl bg-pastel-mint border-2 border-charcoal shadow-hard-xs flex items-center justify-center text-4xl font-black font-display text-charcoal">
                      {selectedLetter.letter}
                    </div>
                    <div>
                      <h3 className="text-xl font-black font-display text-charcoal">
                        Letter {selectedLetter.letter}
                      </h3>
                      <p className="text-xs text-charcoal-muted font-medium">
                        {languageNames[activeLanguage].name} Manual Alphabet
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => speakText(`Letter ${selectedLetter.letter}`)}
                    className="neo-btn p-2.5 bg-pastel-yellow text-charcoal shadow-hard-xs hover:bg-pastel-yellow/80"
                    title="Audio pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Key Configuration Specs */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-cream-100 border border-charcoal/20 space-y-1">
                    <span className="font-bold text-charcoal block">Hand Configuration:</span>
                    <p className="text-charcoal-muted leading-relaxed">
                      {selectedLetter.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-cream-100 border border-charcoal/20 space-y-1">
                    <span className="font-bold text-charcoal block">Palm Orientation:</span>
                    <p className="text-charcoal-muted">
                      {selectedLetter.orientation}
                    </p>
                  </div>

                  {selectedLetter.tip && (
                    <div className="p-3 rounded-xl bg-pastel-yellow/40 border border-charcoal/20 space-y-1">
                      <span className="font-bold text-charcoal flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        Memory Tip:
                      </span>
                      <p className="text-charcoal-muted italic">
                        "{selectedLetter.tip}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Practice Action */}
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('gesture-lab')}
                    className="w-full neo-btn bg-charcoal text-white py-2.5 text-xs font-bold shadow-hard-xs flex items-center justify-center gap-2 hover:bg-black"
                  >
                    <Camera className="w-3.5 h-3.5 text-pastel-mint" />
                    <span>Practice Letter {selectedLetter.letter} in Lab</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="neo-card p-8 text-center text-charcoal-muted">
                <Hand className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">Select a letter to view configuration details.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeCategory === 'numbers' ? (
        /* Numbers Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredNumbers.map((num) => (
            <div
              key={num.number}
              className="neo-card p-5 bg-white border-2 border-charcoal shadow-hard flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black font-display text-charcoal">
                  {num.number}
                </span>
                <button
                  onClick={() => speakText(`Number ${num.number}`)}
                  className="p-1.5 rounded-lg bg-pastel-yellow border border-charcoal hover:bg-pastel-yellow/80 shadow-hard-xs"
                  title="Audio pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5 text-charcoal" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="inline-block px-2 py-0.5 rounded-full font-bold border border-charcoal bg-pastel-blue text-[10px]">
                  {num.hands} {num.hands === 1 ? 'Hand' : 'Hands'}
                </span>
                <p className="text-charcoal-muted leading-relaxed">
                  {num.description}
                </p>
                <p className="text-[11px] text-charcoal/70 italic">
                  Orientation: {num.orientation}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vocabulary Signs Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVocabulary.map((item) => (
            <div
              key={item.id}
              className="neo-card p-5 bg-white border-2 border-charcoal shadow-hard space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="neo-pill bg-pastel-mint px-2.5 py-0.5 text-[10px] font-bold text-charcoal">
                    {item.category.toUpperCase()}
                  </span>
                  <button
                    onClick={() => speakText(item.label.replace('_', ' '))}
                    className="p-1.5 rounded-lg bg-pastel-yellow border border-charcoal hover:bg-pastel-yellow/80 shadow-hard-xs"
                    title="Audio pronunciation"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-charcoal" />
                  </button>
                </div>

                <h3 className="text-xl font-black font-display text-charcoal tracking-tight">
                  {item.label.replace('_', ' ')}
                </h3>

                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-charcoal/10 space-y-2 text-[11px]">
                {item.hand_orientation && (
                  <div className="flex items-center justify-between text-charcoal-muted">
                    <span className="font-bold">Orientation:</span>
                    <span>{item.hand_orientation}</span>
                  </div>
                )}
                {item.start_position && (
                  <div className="flex items-center justify-between text-charcoal-muted">
                    <span className="font-bold">Trajectory:</span>
                    <span>{item.start_position} → {item.end_position || 'finish'}</span>
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('gesture-lab')}
                  className="w-full neo-btn bg-cream-100 text-charcoal py-1.5 text-xs font-bold hover:bg-pastel-mint mt-2 border border-charcoal shadow-hard-xs"
                >
                  Practice "{item.label.replace('_', ' ')}" in Camera
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignWorkbook;
