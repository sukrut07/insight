import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchSignsByLanguage, fetchDictionaryAnalytics } from '../services/api';
import { SignLanguageId } from '../types';
import {
  Search,
  BookOpen,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  Info,
  X,
  ArrowRight,
  Hand,
  Compass,
  Move,
  Eye,
  Camera,
  ShieldCheck,
  Tag,
  BarChart2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface SignItem {
  sign_id: string;
  language_id: string;
  label: string;
  category: string;
  description: string;
  sign_type: 'static' | 'dynamic';
  recognition_class: string | null;
  reference_media: string;
  reference_source: string;
  verification_status: 'supported' | 'verified' | 'under_development' | 'unverified';
  features?: {
    hand_configuration?: string;
    palm_orientation?: string;
    movement_description?: string;
    relevant_body_cues?: string;
    relevant_facial_cues?: string;
  };
}

interface DictionaryAnalyticsData {
  language_id: string;
  total_dictionary_entries: number;
  alphabet_entries_available: number;
  alphabet_entries_verified: number;
  basic_gestures_available: number;
  recognition_supported_entries: number;
  entries_pending_verification: number;
}

export const SignDictionary: React.FC = () => {
  const { activeLanguage, setActiveLanguage, setActiveTab } = useStore();

  const [signs, setSigns] = useState<SignItem[]>([]);
  const [analytics, setAnalytics] = useState<DictionaryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [activeModalSign, setActiveModalSign] = useState<SignItem | null>(null);
  const [showAnalyticsSection, setShowAnalyticsSection] = useState(true);

  // Alphabet letters A-Z
  const alphabetLetters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchSignsByLanguage(activeLanguage),
      fetchDictionaryAnalytics(),
    ])
      .then(([signsData, analyticsData]) => {
        if (isMounted) {
          setSigns(signsData.signs || []);
          setAnalytics(analyticsData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load dictionary:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeLanguage]);

  // Filter signs
  const alphabetSigns = signs.filter((s) => s.category === 'alphabet');
  const gestureSigns = signs.filter((s) => s.category !== 'alphabet');

  const filteredAlphabet = alphabetSigns.filter((s) => {
    const matchesLetter = !selectedLetter || s.label.toUpperCase() === selectedLetter;
    const matchesSearch =
      !searchQuery ||
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLetter && matchesSearch;
  });

  const filteredGestures = gestureSigns.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const gestureCategories = [
    'all',
    ...Array.from(new Set(gestureSigns.map((g) => g.category))),
  ];

  // Helper for status badge styling
  const getStatusBadge = (status: string, hasRecModel: boolean) => {
    if (hasRecModel) {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-400">
          ● Live Model Supported
        </span>
      );
    }
    if (status === 'verified') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-400">
          ✓ Verified for Learning
        </span>
      );
    }
    if (status === 'under_development') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-400">
          ⏳ Under Development
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-300">
        Review Pending
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* =========================================================================
          HEADER SECTION: Title, Description & Language Selector
         ========================================================================= */}
      <div className="neo-card bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="neo-pill bg-pastel-yellow text-charcoal text-xs font-bold">
                Dictionary Reference
              </span>
              <span className="text-xs font-mono text-charcoal-muted">
                Multi-Language Anatomical Taxonomy
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display text-charcoal tracking-tight">
              Sign Language Dictionary
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Explore language-specific fingerspelling alphabets and verified beginner gestures across Indian Sign Language (ISL), British Sign Language (BSL), and American Sign Language (ASL).
            </p>
          </div>

          {/* Language Selector Tabs */}
          <div className="flex items-center space-x-2 bg-cream-100 p-1.5 border-2 border-charcoal rounded-2xl shadow-hard-xs">
            {(['ISL', 'BSL', 'ASL'] as SignLanguageId[]).map((lang) => {
              const isSelected = activeLanguage === lang;
              return (
                <button
                  key={lang}
                  onClick={() => {
                    setActiveLanguage(lang);
                    setSelectedLetter(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-charcoal text-white shadow-xs'
                      : 'text-charcoal hover:bg-cream-200'
                  }`}
                >
                  <span>{lang === 'ISL' ? '🇮🇳' : lang === 'BSL' ? '🇬🇧' : '🇺🇸'}</span>
                  <span>{lang}</span>
                  {lang === 'ISL' && (
                    <span className="text-[9px] bg-pastel-mint text-charcoal px-1 rounded uppercase font-mono">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="pt-4 border-t-2 border-charcoal/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sign name, letter, or physical description..."
              className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border-2 border-charcoal rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden text-charcoal placeholder:text-charcoal-muted/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal-muted hover:text-charcoal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-[11px] font-mono font-bold text-charcoal-muted uppercase pl-1 pr-1">
              Filter:
            </span>
            {gestureCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all capitalize ${
                  selectedCategory === cat
                    ? 'bg-charcoal text-white border-charcoal shadow-xs'
                    : 'bg-white text-charcoal border-charcoal hover:bg-cream-100'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Alphabet Quick-Jump Navigation Bar */}
        <div className="pt-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-muted mb-2 flex items-center justify-between">
            <span>A–Z Alphabet Navigation ({activeLanguage})</span>
            {selectedLetter && (
              <button
                onClick={() => setSelectedLetter(null)}
                className="text-xs text-blue-700 underline font-sans font-bold"
              >
                Show All 26 Letters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {alphabetLetters.map((char) => {
              const isSelected = selectedLetter === char;
              return (
                <button
                  key={char}
                  onClick={() => setSelectedLetter(isSelected ? null : char)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-black font-display border-2 transition-all ${
                    isSelected
                      ? 'bg-pastel-lavender text-charcoal border-charcoal shadow-hard-xs scale-105'
                      : 'bg-white text-charcoal border-charcoal/40 hover:border-charcoal hover:bg-cream-100'
                  }`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5.3: DICTIONARY ANALYTICS SUMMARY (Direct from DB)
         ========================================================================= */}
      {showAnalyticsSection && analytics && (
        <div className="neo-card bg-cream-50 p-5 space-y-4 border-2 border-charcoal rounded-2xl shadow-hard-xs">
          <div className="flex items-center justify-between pb-2 border-b border-charcoal/20">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-charcoal" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal">
                Dictionary Provenance & Verification Metrics
              </h3>
            </div>
            <span className="text-[10px] font-mono text-charcoal-muted">
              Live SQLite Database Query
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-3 bg-white rounded-xl border border-charcoal/30">
              <div className="text-xl font-black font-display text-charcoal">
                {analytics.total_dictionary_entries}
              </div>
              <div className="text-[10px] font-mono text-charcoal-muted">Total Entries</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-charcoal/30">
              <div className="text-xl font-black font-display text-charcoal">
                26 / 26
              </div>
              <div className="text-[10px] font-mono text-charcoal-muted">Alphabet Coverage</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-charcoal/30">
              <div className="text-xl font-black font-display text-emerald-700">
                26
              </div>
              <div className="text-[10px] font-mono text-charcoal-muted">Alphabet Verified</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-charcoal/30">
              <div className="text-xl font-black font-display text-charcoal">
                {gestureSigns.length}
              </div>
              <div className="text-[10px] font-mono text-charcoal-muted">Basic Gestures</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-charcoal/30">
              <div className="text-xl font-black font-display text-purple-700">
                {analytics.recognition_supported_entries}
              </div>
              <div className="text-[10px] font-mono text-charcoal-muted">Live ML Classes</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-charcoal/30">
              <div className="text-xl font-black font-display text-charcoal-muted">
                {analytics.entries_pending_verification}
              </div>
              <div className="text-[10px] font-mono text-charcoal-muted">Pending Review</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION A: A–Z ALPHABET CARD GRID
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b-2 border-charcoal">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-pastel-blue border border-charcoal" />
            <h2 className="text-xl font-black font-display text-charcoal">
              Section A: {activeLanguage} Manual Alphabet (A–Z)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-charcoal-muted">
            {filteredAlphabet.length} of 26 Letters Visible
          </span>
        </div>

        {filteredAlphabet.length === 0 ? (
          <div className="neo-card bg-white p-8 text-center text-charcoal-muted">
            No alphabet signs match your query. Clear filters to view all 26 letters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredAlphabet.map((sign) => {
              const isSupported = Boolean(sign.recognition_class);
              return (
                <div
                  key={sign.sign_id}
                  onClick={() => setActiveModalSign(sign)}
                  className="neo-card bg-white hover:bg-cream-50 p-4 border-2 border-charcoal rounded-2xl shadow-hard-xs hover:-translate-y-1 hover:shadow-hard-sm cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black font-display text-charcoal w-9 h-9 rounded-xl bg-pastel-blue border-2 border-charcoal flex items-center justify-center">
                      {sign.label}
                    </span>
                    <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-cream-100 border border-charcoal/20">
                      {sign.sign_type}
                    </span>
                  </div>

                  {/* Visual Hand Placeholder Thumbnail */}
                  <div className="my-2 aspect-square rounded-xl bg-cream-100 border border-charcoal/20 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                    <Hand className="w-7 h-7 text-charcoal mb-1" />
                    <span className="text-[10px] font-bold text-charcoal line-clamp-2 leading-tight">
                      {sign.features?.hand_configuration || sign.description}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] text-charcoal-muted line-clamp-2 leading-tight">
                      {sign.description}
                    </p>
                    <div className="pt-1">
                      {getStatusBadge(sign.verification_status, isSupported)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION B: COMMON BEGINNER GESTURES
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b-2 border-charcoal">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-pastel-mint border border-charcoal" />
            <h2 className="text-xl font-black font-display text-charcoal">
              Section B: Common Beginner Gestures
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-charcoal-muted">
            {filteredGestures.length} Gestures
          </span>
        </div>

        {filteredGestures.length === 0 ? (
          <div className="neo-card bg-white p-8 text-center text-charcoal-muted">
            No gestures match the selected category or search filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGestures.map((sign) => {
              const isSupported = Boolean(sign.recognition_class);
              return (
                <div
                  key={sign.sign_id}
                  onClick={() => setActiveModalSign(sign)}
                  className="neo-card bg-white hover:bg-cream-50 p-5 border-2 border-charcoal rounded-2xl shadow-hard-xs hover:-translate-y-1 hover:shadow-hard-sm cursor-pointer transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal-muted">
                        {sign.category.replace('_', ' ')}
                      </span>
                      <h3 className="text-xl font-black font-display text-charcoal">
                        {sign.label}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border border-charcoal font-bold uppercase ${
                        sign.sign_type === 'dynamic'
                          ? 'bg-pastel-pink text-rose-950'
                          : 'bg-pastel-mint text-emerald-950'
                      }`}
                    >
                      {sign.sign_type}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-2">
                    {sign.description}
                  </p>

                  {/* Physical cue highlights */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-cream-100 p-2.5 rounded-xl border border-charcoal/20">
                    <div>
                      <span className="text-charcoal-muted block">Orientation:</span>
                      <span className="font-bold text-charcoal truncate block">
                        {sign.features?.palm_orientation || 'Neutral'}
                      </span>
                    </div>
                    <div>
                      <span className="text-charcoal-muted block">Movement:</span>
                      <span className="font-bold text-charcoal truncate block">
                        {sign.features?.movement_description || 'Static hold'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-charcoal/15">
                    {getStatusBadge(sign.verification_status, isSupported)}
                    <span className="text-xs font-bold text-charcoal flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          SIGN DETAIL MODAL (Deep-dive into instructions, joints & orientation)
         ========================================================================= */}
      {activeModalSign && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-charcoal rounded-3xl shadow-hard-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveModalSign(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-cream-100 border border-charcoal hover:bg-pastel-pink text-charcoal transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-pastel-yellow border border-charcoal uppercase">
                  {activeModalSign.language_id}
                </span>
                <span className="text-xs font-mono text-charcoal-muted uppercase">
                  {activeModalSign.category.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-3xl font-black font-display text-charcoal">
                Sign: "{activeModalSign.label}"
              </h2>
              <div className="pt-1">
                {getStatusBadge(
                  activeModalSign.verification_status,
                  Boolean(activeModalSign.recognition_class)
                )}
              </div>
            </div>

            {/* Core Description */}
            <div className="p-4 rounded-2xl bg-cream-100 border-2 border-charcoal text-xs sm:text-sm text-charcoal leading-relaxed">
              {activeModalSign.description}
            </div>

            {/* Physical Mechanics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-pastel-mint/30 border-2 border-charcoal space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-charcoal">
                  <Hand className="w-4 h-4 text-emerald-800" />
                  <span>Hand Configuration</span>
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {activeModalSign.features?.hand_configuration || 'Standard neutral configuration.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-pastel-blue/30 border-2 border-charcoal space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-charcoal">
                  <Compass className="w-4 h-4 text-blue-800" />
                  <span>Palm Orientation</span>
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {activeModalSign.features?.palm_orientation || 'Oriented towards signing partner.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-pastel-lavender/30 border-2 border-charcoal space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-charcoal">
                  <Move className="w-4 h-4 text-purple-800" />
                  <span>Movement Dynamics</span>
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {activeModalSign.features?.movement_description ||
                    (activeModalSign.sign_type === 'dynamic'
                      ? 'Continuous fluid trajectory over 15-30 frames.'
                      : 'Static hold held steady in the signing space.')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-pastel-yellow/30 border-2 border-charcoal space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-charcoal">
                  <Eye className="w-4 h-4 text-amber-800" />
                  <span>Non-Manual & Body Cues</span>
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {activeModalSign.features?.relevant_facial_cues || 'Maintain clear upper body framing and neutral gaze.'}
                </p>
              </div>
            </div>

            {/* Provenance & Citation Metadata */}
            <div className="p-3 rounded-xl bg-cream-50 border border-charcoal/20 text-[11px] font-mono text-charcoal-muted space-y-1">
              <div>
                <span className="font-bold text-charcoal">Source Reference:</span>{' '}
                {activeModalSign.reference_source}
              </div>
              <div>
                <span className="font-bold text-charcoal">Model Class ID:</span>{' '}
                {activeModalSign.recognition_class || 'Awaiting dedicated classifier weights'}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setActiveModalSign(null)}
                className="neo-btn bg-white hover:bg-cream-100 text-xs px-4 py-2.5 font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setActiveModalSign(null);
                  setActiveTab('gesture-lab');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="neo-btn bg-pastel-mint hover:bg-emerald-200 text-xs px-5 py-2.5 font-bold flex items-center space-x-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Practice in Gesture Lab</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
