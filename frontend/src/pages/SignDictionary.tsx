import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchLanguageVocabulary, fetchLanguageAlphabet } from '../services/api';
import { SignLanguageId, SignReferenceItem, AlphabetItem } from '../types';
import { SignLanguageSelector } from '../components/SignLanguageSelector';
import { SignReferenceCard } from '../components/SignReferenceCard';
import { SignPracticePanel } from '../components/SignPracticePanel';
import { Search, BookOpen, Layers, Sparkles, Filter } from 'lucide-react';

export const SignDictionary: React.FC = () => {
  const { activeLanguage, setActiveTab } = useStore();
  const [vocabulary, setVocabulary] = useState<SignReferenceItem[]>([]);
  const [alphabet, setAlphabet] = useState<AlphabetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [practicingSign, setPracticingSign] = useState<SignReferenceItem | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'vocabulary' | 'alphabet'>('vocabulary');

  useEffect(() => {
    fetchLanguageVocabulary(activeLanguage)
      .then((data) => {
        if (data?.vocabulary) setVocabulary(data.vocabulary);
      })
      .catch((err) => console.warn('Could not load vocabulary:', err));

    fetchLanguageAlphabet(activeLanguage)
      .then((data) => {
        if (data?.alphabet) setAlphabet(data.alphabet);
      })
      .catch((err) => console.warn('Could not load alphabet:', err));
  }, [activeLanguage]);

  const categories = ['all', ...Array.from(new Set(vocabulary.map((v) => v.category || 'general')))];

  const filteredVocabulary = vocabulary.filter((v) => {
    const matchesSearch =
      v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (practicingSign) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignPracticePanel
          sign={practicingSign}
          language={activeLanguage}
          onBack={() => setPracticingSign(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="neo-card bg-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="neo-pill bg-pastel-yellow text-charcoal text-xs font-bold">
                Dictionary
              </span>
              <span className="text-xs font-mono text-charcoal-muted">
                Multilingual Reference Library
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display text-charcoal tracking-tight">
              Sign Language Dictionary.
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl">
              Illustrated references, manual fingerspelling alphabets, and movement mechanics.
            </p>
          </div>

          <SignLanguageSelector />
        </div>
      </div>

      {/* Sub Tabs: Vocabulary vs Alphabet */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-charcoal">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('vocabulary')}
            className={`neo-btn px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === 'vocabulary'
                ? 'bg-pastel-mint text-charcoal'
                : 'bg-white text-charcoal-muted'
            }`}
          >
            Core Vocabulary ({vocabulary.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('alphabet')}
            className={`neo-btn px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === 'alphabet'
                ? 'bg-pastel-blue text-charcoal'
                : 'bg-white text-charcoal-muted'
            }`}
          >
            Fingerspelling Alphabet ({alphabet.length})
          </button>
        </div>

        {/* Search */}
        {activeSubTab === 'vocabulary' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search signs..."
                className="bg-white border-2 border-charcoal rounded-xl pl-9 pr-3 py-1.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-pastel-mint w-48 sm:w-64"
              />
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Tab Content */}
      {activeSubTab === 'vocabulary' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Filter className="w-3.5 h-3.5 text-charcoal-muted flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`neo-pill text-xs font-bold uppercase transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-charcoal text-cream-100'
                    : 'bg-white text-charcoal hover:bg-cream-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVocabulary.map((sign) => (
              <SignReferenceCard
                key={sign.id}
                sign={sign}
                language={activeLanguage}
                onPractice={(s) => setPracticingSign(s)}
                isRecognizedInActiveModel={activeLanguage === 'ISL'}
              />
            ))}
          </div>

          {filteredVocabulary.length === 0 && (
            <div className="text-center py-16 neo-card bg-white">
              <BookOpen className="w-12 h-12 text-charcoal-muted mx-auto mb-2" />
              <p className="text-charcoal-muted text-sm font-medium">No signs found matching criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Alphabet Tab Content */}
      {activeSubTab === 'alphabet' && (
        <div className="space-y-6">
          <div className="p-4 bg-pastel-blue border-2 border-charcoal rounded-2xl text-xs text-charcoal flex items-start space-x-3 shadow-hard-xs">
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-700" />
            <div>
              <span className="font-bold block mb-0.5">
                {activeLanguage} Manual Alphabet Characteristics
              </span>
              {activeLanguage === 'BSL'
                ? 'BSL utilizes a two-handed manual alphabet where the dominant index touches fingers of the non-dominant hand for vowels (Thumb=A, Index=E, Middle=I, Ring=O, Pinky=U).'
                : activeLanguage === 'ASL'
                ? 'ASL utilizes a one-handed manual alphabet derived from the French manual tradition, forming all 26 letters with one dominant hand.'
                : 'ISL uses a distinct fingerspelling system with regional variations, incorporating both two-handed consonant touches and single-handed configurations.'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {alphabet.map((item) => (
              <div
                key={item.letter}
                className="neo-card bg-white p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-pastel-mint border-2 border-charcoal flex items-center justify-center text-3xl font-black font-display text-charcoal mb-2 shadow-hard-xs">
                  {item.letter}
                </div>
                <span className="neo-pill bg-cream-100 text-[10px] font-bold text-charcoal uppercase mb-2">
                  {item.hands === 2 ? '2 Hands' : '1 Hand'}
                </span>
                <p className="text-xs text-charcoal font-medium line-clamp-3 leading-tight">
                  {item.description}
                </p>
                <span className="text-[10px] text-charcoal-muted font-mono mt-2">
                  {item.orientation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
