import React from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { HeroCardStack } from '../components/HeroCardStack';
import {
  SmileyDoodle,
  SparkleDoodle,
  CurvedArrowDoodle,
  HandLineArt,
} from '../components/Doodles';
import { InteractiveDotCanvas } from '../components/InteractiveDotCanvas';
import { LandingKpiCards } from '../components/LandingKpiCards';

import {
  ArrowRight,
  ArrowDown,
  Camera,
  Layers,
  Cpu,
  ShieldCheck,
  Volume2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Github,
  Zap,
  Eye,
} from 'lucide-react';
import { SignLanguageId } from '../types';

export const InsightLandingPage: React.FC = () => {
  const { setActiveTab, setActiveLanguage } = useStore();

  const handleExploreLanguage = (lang: SignLanguageId) => {
    setActiveLanguage(lang);
    setActiveTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Interactive Pastel Dot Canvas Background & Cursor Trail */}
      <InteractiveDotCanvas />

      {/* Main Content Sections */}
      <div className="relative space-y-20 sm:space-y-28">
        {/* =========================================================================
            SECTION 2: HERO
           ========================================================================= */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Bold Typography & Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-8"
          >
            {/* Top Pill Tags */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="neo-pill bg-pastel-mint text-charcoal flex items-center gap-2 px-3.5 py-1.5 shadow-hard-xs text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <span className="font-bold">A New Way to Connect</span>
              </span>
              <span className="neo-pill bg-pastel-yellow text-charcoal px-3.5 py-1.5 shadow-hard-xs text-xs font-bold">
                Local On-Device AI • Gemma 4 E4B
              </span>
            </div>

            {/* Headline with Pastel Highlighter Box */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display text-charcoal tracking-tight leading-[1.05]">
                <span className="relative inline-block">
                  <span className="relative z-10">Communicate</span>
                  <span className="absolute inset-x-0 bottom-2 top-4 bg-pastel-mint -rotate-1 rounded-xl -z-0 border-2 border-charcoal/20" />
                </span>
                <br />
                without barriers.
              </h1>
              <p className="text-base sm:text-lg text-charcoal-muted max-w-xl leading-relaxed pt-2">
                Discover a new way to understand gestures, explore sign languages, and make communication accessible through computer vision and local Google Gemma 4 models.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('gesture-lab');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="neo-btn bg-pastel-lavender hover:bg-pastel-pink text-charcoal px-7 py-3.5 text-sm sm:text-base flex items-center space-x-2"
              >
                <span>Explore Gesture Lab</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('languages')}
                className="neo-btn bg-white hover:bg-cream-200 text-charcoal px-6 py-3.5 text-sm sm:text-base flex items-center space-x-2"
              >
                <span>Discover sign languages</span>
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Social / Social Proof Stat Banner (from Reference 5) */}
            <div className="pt-4 flex items-center space-x-4 border-t-2 border-charcoal/10">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-pastel-pink border-2 border-charcoal flex items-center justify-center font-bold text-xs text-charcoal">
                  🇮🇳
                </div>
                <div className="w-9 h-9 rounded-full bg-pastel-blue border-2 border-charcoal flex items-center justify-center font-bold text-xs text-charcoal">
                  🇬🇧
                </div>
                <div className="w-9 h-9 rounded-full bg-pastel-mint border-2 border-charcoal flex items-center justify-center font-bold text-xs text-charcoal">
                  🇺🇸
                </div>
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-charcoal">3 Distinct Sign Languages</span>
                <p className="text-charcoal-muted">ISL (India) • BSL (Britain) • ASL (America)</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Fanning Card Stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-5 relative"
          >
            <div className="p-4 sm:p-6 rounded-3xl bg-white/60 border-2 border-charcoal/20 backdrop-blur-sm relative shadow-hard">
              <div className="flex items-center justify-between pb-3 text-xs font-bold text-charcoal/70 border-b border-charcoal/10 mb-4">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Interactive Preview</span>
                </span>
                <span className="text-[11px] font-mono text-charcoal-muted">Click card to cycle</span>
              </div>
              <HeroCardStack />
            </div>
          </motion.div>
        </div>

        {/* -------------------------------------------------------------------------
            WORD BUBBLE BANNER (Inspired by Reference Image 3)
           ------------------------------------------------------------------------- */}
        <div className="mt-20 pt-10 border-t-2 border-charcoal/15 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-charcoal-muted font-bold mb-6">
            Connecting People Through Movement
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto py-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="px-6 py-3 rounded-full bg-pastel-pink border-2 border-charcoal shadow-hard-xs text-lg sm:text-2xl font-black font-display text-charcoal"
            >
              Learn sign
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="px-6 py-3 rounded-2xl bg-pastel-blue border-2 border-charcoal shadow-hard text-lg sm:text-2xl font-black font-display text-charcoal"
            >
              language
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: -1 }}
              className="px-5 py-3 rounded-full bg-pastel-lavender border-2 border-charcoal shadow-hard-xs text-lg sm:text-2xl font-black font-display text-charcoal"
            >
              and
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="px-6 py-3 rounded-full bg-pastel-yellow border-2 border-charcoal shadow-hard-xs text-lg sm:text-2xl font-black font-display text-charcoal"
            >
              get
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="px-6 py-3 rounded-2xl bg-cream-100 border-2 border-charcoal shadow-hard text-lg sm:text-2xl font-black font-display text-charcoal"
            >
              closer to
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="px-6 py-3 rounded-full bg-pastel-mint border-2 border-charcoal shadow-hard-xs text-lg sm:text-2xl font-black font-display text-charcoal"
            >
              others
            </motion.div>
          </div>

          <div className="max-w-xl mx-auto mt-4 text-xs sm:text-sm text-charcoal-muted flex items-center justify-center space-x-2">
            <span>✨</span>
            <span>Fun, intuitive, and accessible fundamentals right in your browser.</span>
            <span>✨</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PLATFORM LEVEL KPI METRICS (Direct from SQLite Database)
         ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingKpiCards />
      </section>

      {/* =========================================================================
          SECTION 3: INTRODUCTION / PURPOSE
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="neo-card bg-white p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left side: Editorial Typography */}
            <div className="lg:col-span-7 space-y-6">
              <span className="neo-pill bg-pastel-yellow text-charcoal shadow-hard-xs">
                03 — The Purpose
              </span>
              <h2 className="text-3xl sm:text-5xl font-black font-display text-charcoal leading-tight">
                More than recognition.
                <br />
                A bridge between people.
              </h2>
              <p className="text-charcoal-muted leading-relaxed text-sm sm:text-base">
                Sign languages are not word-for-word spoken translations; they are rich, complete natural languages with their own complex spatial grammar, facial expressions, and motion trajectories.
              </p>
              <p className="text-charcoal-muted leading-relaxed text-sm sm:text-base">
                <strong>iNSIGHT</strong> unites computer vision with Google's Gemma 4 open-weight models to bridge the gap between static gestures and genuine fluid conversations — fully local, privacy-first, and accessible.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-cream-100 border-2 border-charcoal text-xs font-bold text-charcoal flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No Cloud Video Uploads</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-cream-100 border-2 border-charcoal text-xs font-bold text-charcoal flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>553 Spatial Landmarks</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-cream-100 border-2 border-charcoal text-xs font-bold text-charcoal flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Contextual Gemma 4 Refinement</span>
                </div>
              </div>
            </div>

            {/* Right side: Layered composition */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="neo-card bg-pastel-mint p-6 transform -rotate-2 relative z-10">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-charcoal mb-4">
                    <span className="text-xs font-bold font-mono uppercase">Vision Pipeline</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-charcoal">
                      25 FPS
                    </span>
                  </div>
                  <HandLineArt type="ily" className="w-32 h-32 mx-auto my-2" />
                  <div className="mt-4 p-3 bg-white border-2 border-charcoal rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-mono font-bold">
                      <span>Sign: I LOVE YOU</span>
                      <span className="text-emerald-700">96.8%</span>
                    </div>
                    <p className="text-[11px] text-charcoal-muted">
                      Thumb, index & pinky extended. Palm forward.
                    </p>
                  </div>
                </div>

                <div className="absolute top-6 left-6 w-full h-full neo-card bg-pastel-pink -z-0 transform rotate-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: THREE SIGN LANGUAGES
         ========================================================================= */}
      <section id="languages" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="neo-pill bg-pastel-pink text-charcoal shadow-hard-xs">
            04 — Multilingual Engine
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display text-charcoal">
            One platform.
            <br />
            Three distinct sign languages.
          </h2>
          <p className="text-sm sm:text-base text-charcoal-muted">
            Sign languages differ by region, grammar, and vocabulary. We treat each as an independent, fully respected language.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Card 1: ISL */}
          <motion.div
            whileHover={{ y: -6 }}
            className="neo-card bg-pastel-mint p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🇮🇳</span>
                <span className="neo-pill bg-white text-charcoal text-[11px] font-bold">
                  Primary Model Available
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black font-display text-charcoal">ISL</h3>
                <p className="text-xs font-bold text-charcoal/70">Indian Sign Language</p>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Utilizes two-handed manual fingerspelling and rich spatial morphology. Supported across 24 core vocabulary signs and verified landmark mappings.
              </p>

              <div className="bg-white/80 border-2 border-charcoal rounded-xl p-3 text-xs space-y-1">
                <span className="font-bold text-charcoal block">Key Features:</span>
                <ul className="list-disc list-inside text-charcoal-muted text-[11px] space-y-0.5">
                  <li>Two-handed alphabet representation</li>
                  <li>SOV (Subject-Object-Verb) grammar</li>
                  <li>Spatial directional verbs</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleExploreLanguage('ISL')}
              className="neo-btn bg-white hover:bg-cream-100 text-charcoal w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <span>Explore ISL in Learning Centre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Card 2: BSL */}
          <motion.div
            whileHover={{ y: -6 }}
            className="neo-card bg-pastel-pink p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🇬🇧</span>
                <span className="neo-pill bg-white text-charcoal text-[11px] font-bold">
                  Vocabulary & Learn
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black font-display text-charcoal">BSL</h3>
                <p className="text-xs font-bold text-charcoal/70">British Sign Language</p>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Features a distinctive two-handed manual alphabet completely different from ASL, with topic-comment structure and multi-channel sign grammar.
              </p>

              <div className="bg-white/80 border-2 border-charcoal rounded-xl p-3 text-xs space-y-1">
                <span className="font-bold text-charcoal block">Key Features:</span>
                <ul className="list-disc list-inside text-charcoal-muted text-[11px] space-y-0.5">
                  <li>Two-handed fingerspelling system</li>
                  <li>BANZSL language family</li>
                  <li>Spatial classifier predicates</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleExploreLanguage('BSL')}
              className="neo-btn bg-white hover:bg-cream-100 text-charcoal w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <span>Explore BSL in Learning Centre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Card 3: ASL */}
          <motion.div
            whileHover={{ y: -6 }}
            className="neo-card bg-pastel-blue p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🇺🇸</span>
                <span className="neo-pill bg-white text-charcoal text-[11px] font-bold">
                  Fingerspelling & Lexicon
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black font-display text-charcoal">ASL</h3>
                <p className="text-xs font-bold text-charcoal/70">American Sign Language</p>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                One-handed manual alphabet originating from French Sign Language (LSF), incorporating non-manual signals and topicalization.
              </p>

              <div className="bg-white/80 border-2 border-charcoal rounded-xl p-3 text-xs space-y-1">
                <span className="font-bold text-charcoal block">Key Features:</span>
                <ul className="list-disc list-inside text-charcoal-muted text-[11px] space-y-0.5">
                  <li>One-handed fingerspelling</li>
                  <li>Topic-Comment syntax</li>
                  <li>Rich morphological inflection</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleExploreLanguage('ASL')}
              className="neo-btn bg-white hover:bg-cream-100 text-charcoal w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <span>Explore ASL in Learning Centre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: HOW IT WORKS (Timeline)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="neo-pill bg-pastel-yellow text-charcoal shadow-hard-xs">
            05 — Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display text-charcoal">
            From movement to meaning.
          </h2>
          <p className="text-sm sm:text-base text-charcoal-muted">
            Five coordinated steps transform camera video streams into natural spoken language.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
          {/* Step 1 */}
          <div className="neo-card bg-white p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-pastel-mint border-2 border-charcoal flex items-center justify-center font-black font-mono text-sm text-charcoal shadow-hard-xs">
              01
            </div>
            <h4 className="font-bold text-sm text-charcoal font-display">Capture</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Camera streams live frames with user-granted permissions at 25-30 FPS.
            </p>
          </div>

          {/* Step 2 */}
          <div className="neo-card bg-pastel-mint p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-charcoal flex items-center justify-center font-black font-mono text-sm text-charcoal shadow-hard-xs">
              02
            </div>
            <h4 className="font-bold text-sm text-charcoal font-display">Detect</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              MediaPipe Holistic extracts 553 landmarks across hands, pose, and face.
            </p>
          </div>

          {/* Step 3 */}
          <div className="neo-card bg-white p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-pastel-blue border-2 border-charcoal flex items-center justify-center font-black font-mono text-sm text-charcoal shadow-hard-xs">
              03
            </div>
            <h4 className="font-bold text-sm text-charcoal font-display">Recognise</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Language models classify gestures and output confidence-calibrated predictions.
            </p>
          </div>

          {/* Step 4 */}
          <div className="neo-card bg-pastel-lavender p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-charcoal flex items-center justify-center font-black font-mono text-sm text-charcoal shadow-hard-xs">
              04
            </div>
            <h4 className="font-bold text-sm text-charcoal font-display">Interpret</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Google Gemma 4 E4B via Ollama weaves token sequences into fluid English grammar.
            </p>
          </div>

          {/* Step 5 */}
          <div className="neo-card bg-pastel-pink p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-charcoal flex items-center justify-center font-black font-mono text-sm text-charcoal shadow-hard-xs">
              05
            </div>
            <h4 className="font-bold text-sm text-charcoal font-display">Communicate</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Displays readable text and generates spoken audio through native Speech Synthesis.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: GESTURE LAB PREVIEW
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="neo-card bg-pastel-blue p-8 sm:p-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <span className="neo-pill bg-white text-charcoal shadow-hard-xs">
                06 — Live Workspace
              </span>
              <h2 className="text-3xl sm:text-5xl font-black font-display text-charcoal">
                Your own gesture workspace.
              </h2>
              <p className="text-sm sm:text-base text-charcoal-muted max-w-xl">
                Experience real-time recognition, landmark tracking, and Gemma 4 sentence refinement in the dedicated Gesture Lab.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('gesture-lab');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="neo-btn bg-charcoal hover:bg-charcoal/90 text-white px-8 py-4 text-sm font-bold flex items-center space-x-2 shrink-0"
            >
              <span>Enter Gesture Lab</span>
              <ArrowRight className="w-4 h-4 text-pastel-mint" />
            </button>
          </div>

          {/* Interactive UI Mockup */}
          <div className="neo-card bg-cream-100 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-charcoal">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-charcoal animate-pulse" />
                <span className="text-xs font-bold font-mono">Workspace Demo Mode • Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-white border-2 border-charcoal text-xs font-bold">
                  🇮🇳 ISL Selected
                </span>
                <span className="px-3 py-1 rounded-full bg-white border-2 border-charcoal text-xs font-mono font-bold">
                  25 FPS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Simulated Camera Feed */}
              <div className="lg:col-span-7 neo-card bg-charcoal text-white p-6 aspect-video flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-center text-xs text-white/80 z-10">
                  <span className="font-mono">LIVE WEBCAM PREVIEW</span>
                  <span className="bg-emerald-500 text-charcoal px-2 py-0.5 rounded font-bold text-[10px]">
                    HAND TRACKED
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center my-auto z-10 space-y-2">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">
                    ✋
                  </div>
                  <span className="font-mono text-xs text-white/70">
                    MediaPipe 21 Landmarks Extracted
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-white/60 z-10">
                  <span>Latency: 18ms</span>
                  <span>Ollama: gemma4:e4b</span>
                </div>

                {/* Subtle grid lines background */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>

              {/* Simulated Output Panel */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="neo-card bg-white p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-charcoal-muted">
                      CURRENT SIGN
                    </span>
                    <span className="neo-pill bg-pastel-mint text-charcoal text-[10px] font-bold">
                      Confidence 98.4%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-charcoal font-display">
                    NAMASTE / GREETINGS
                  </div>
                  <p className="text-xs text-charcoal-muted">
                    Both palms pressed together vertically in front of the chest.
                  </p>
                </div>

                <div className="neo-card bg-pastel-lavender p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-charcoal-muted">
                      GEMMA 4 TRANSLATION
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-charcoal font-bold">
                      Orchestrated
                    </span>
                  </div>
                  <div className="text-sm font-bold text-charcoal italic">
                    "Greetings to everyone! I am glad to meet you all today."
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('gesture-lab');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="neo-btn bg-pastel-mint hover:bg-pastel-yellow text-charcoal w-full py-3 text-xs font-bold flex items-center justify-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Live Camera & Recognition</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: SIGN LEARNING CENTRE PREVIEW
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="neo-pill bg-pastel-lavender text-charcoal shadow-hard-xs">
            07 — Learning Modules
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display text-charcoal">
            Learn a language beyond words.
          </h2>
          <p className="text-sm sm:text-base text-charcoal-muted">
            Interactive fingerspelling alphabets, high-frequency phrases, and real-time practice feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          <motion.div
            whileHover={{ y: -4 }}
            className="neo-card bg-white p-5 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-pastel-mint border-2 border-charcoal flex items-center justify-center text-xl shadow-hard-xs">
              🔤
            </div>
            <h4 className="font-bold text-base text-charcoal font-display">Alphabet</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Step-by-step fingerspelling guides for ISL two-handed and ASL single-handed systems.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="neo-card bg-white p-5 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-pastel-pink border-2 border-charcoal flex items-center justify-center text-xl shadow-hard-xs">
              👋
            </div>
            <h4 className="font-bold text-base text-charcoal font-display">Greetings</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Essential conversational openers: Hello, Thank you, Please, Good morning, and Welcome.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="neo-card bg-white p-5 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-pastel-blue border-2 border-charcoal flex items-center justify-center text-xl shadow-hard-xs">
              🔢
            </div>
            <h4 className="font-bold text-base text-charcoal font-display">Numbers & Time</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Cardinal numbers, counting systems, and temporal markers for daily interaction.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="neo-card bg-white p-5 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-pastel-yellow border-2 border-charcoal flex items-center justify-center text-xl shadow-hard-xs">
              🎯
            </div>
            <h4 className="font-bold text-base text-charcoal font-display">Practice Mode</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Real-time pose similarity scoring to test your gesture precision against references.
            </p>
          </motion.div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('learn');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="neo-btn bg-pastel-yellow hover:bg-pastel-mint text-charcoal px-8 py-3.5 text-sm font-bold inline-flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Open Full Learning Centre</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: TECHNOLOGY & ARCHITECTURE
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="neo-pill bg-pastel-mint text-charcoal shadow-hard-xs">
            08 — Intelligence
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display text-charcoal">
            Intelligence behind every interaction.
          </h2>
          <p className="text-sm sm:text-base text-charcoal-muted">
            Engineered with a clean separation between computer vision perception and LLM language reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="neo-card bg-white p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pastel-mint border-2 border-charcoal flex items-center justify-center text-2xl shadow-hard-xs">
              👁️
            </div>
            <h3 className="text-xl font-bold font-display text-charcoal">
              MediaPipe Holistic
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Extracts 553 distinct spatial landmarks at 25-30 frames per second on standard hardware, tracking subtle finger curls, wrist orientations, and shoulder movements without special hardware.
            </p>
            <div className="text-[11px] font-mono font-bold text-emerald-700 bg-pastel-mint/30 p-2 rounded-lg border border-charcoal/20">
              Low-latency browser inference
            </div>
          </div>

          <div className="neo-card bg-white p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pastel-lavender border-2 border-charcoal flex items-center justify-center text-2xl shadow-hard-xs">
              🤖
            </div>
            <h3 className="text-xl font-bold font-display text-charcoal">
              Google Gemma 4 E4B
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Google's open-weight model acts as our language intelligence orchestrator. It resolves sign ambiguities, applies regional grammar rules, and produces fluid English sentences from raw gesture tokens.
            </p>
            <div className="text-[11px] font-mono font-bold text-purple-700 bg-pastel-lavender/30 p-2 rounded-lg border border-charcoal/20">
              Benchmarked at 54.5 tokens/sec
            </div>
          </div>

          <div className="neo-card bg-white p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pastel-yellow border-2 border-charcoal flex items-center justify-center text-2xl shadow-hard-xs">
              ⚡
            </div>
            <h3 className="text-xl font-bold font-display text-charcoal">
              Ollama Local Runtime
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Executes Gemma models directly on your local CPU or Apple Silicon GPU via Metal Performance Shaders (MPS). Zero external API calls, zero latency delays, and no recurring token subscription costs.
            </p>
            <div className="text-[11px] font-mono font-bold text-amber-700 bg-pastel-yellow/30 p-2 rounded-lg border border-charcoal/20">
              100% offline-ready runtime
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: PRIVACY & USER CONTROL
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="neo-card bg-white p-8 sm:p-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="neo-pill bg-pastel-pink text-charcoal shadow-hard-xs">
                09 — Trust & Transparency
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-display text-charcoal">
                Your gestures. Your control.
              </h2>
              <p className="text-sm text-charcoal-muted max-w-xl">
                We believe accessibility tools must respect personal privacy above all else.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-pastel-mint border-2 border-charcoal flex items-center justify-center text-2xl shadow-hard-sm">
              🛡️
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-cream-100 border-2 border-charcoal space-y-2">
              <span className="text-base font-bold text-charcoal block">No Auto-Recording</span>
              <p className="text-xs text-charcoal-muted">
                Camera access requires your explicit permission click every session.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-100 border-2 border-charcoal space-y-2">
              <span className="text-base font-bold text-charcoal block">Zero Cloud Video</span>
              <p className="text-xs text-charcoal-muted">
                Raw video never leaves your browser; frames are processed strictly in RAM.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-100 border-2 border-charcoal space-y-2">
              <span className="text-base font-bold text-charcoal block">Inspectable History</span>
              <p className="text-xs text-charcoal-muted">
                View or wipe your local session translation history anytime in Settings.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-100 border-2 border-charcoal space-y-2">
              <span className="text-base font-bold text-charcoal block">Open Source</span>
              <p className="text-xs text-charcoal-muted">
                Auditable pipeline code licensed openly on GitHub for complete transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: FINAL CTA & FOOTER
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="neo-card bg-pastel-lavender p-8 sm:p-16 text-center space-y-8 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black font-display text-charcoal tracking-tight">
              Let's make understanding universal.
            </h2>
            <p className="text-sm sm:text-base text-charcoal-muted">
              Start recognizing signs, explore rich dictionaries, or practice fingerspelling right now with local AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <button
              type="button"
              onClick={() => {
                setActiveTab('gesture-lab');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="neo-btn bg-charcoal hover:bg-charcoal/90 text-white px-8 py-4 text-sm sm:text-base font-bold flex items-center space-x-2"
            >
              <span>Start with iNSIGHT</span>
              <ArrowRight className="w-4 h-4 text-pastel-mint" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('learn');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="neo-btn bg-white hover:bg-cream-100 text-charcoal px-7 py-4 text-sm sm:text-base font-bold flex items-center space-x-2"
            >
              <span>Browse Learning Centre</span>
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-charcoal bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-pastel-mint border-2 border-charcoal flex items-center justify-center text-sm shadow-hard-xs">
                ✌️
              </div>
              <span className="text-2xl font-black font-display tracking-tight text-charcoal">
                iNSIGHT
              </span>
            </div>
            <p className="text-xs text-charcoal-muted max-w-sm leading-relaxed">
              AI-powered multimodal sign-language communication assistant. Built with Google Gemma 4, MediaPipe, and open-weight local intelligence.
            </p>
            <div className="flex items-center space-x-3 text-xs font-mono font-bold text-charcoal">
              <span>Best Use of Gemma 4</span>
              <span>•</span>
              <span>Best Open-Source AI Project</span>
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-charcoal uppercase tracking-wider block font-mono">
                Platform
              </span>
              <ul className="space-y-1.5 text-charcoal-muted">
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('gesture-lab');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-charcoal font-medium"
                  >
                    Gesture Lab
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('learn');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-charcoal font-medium"
                  >
                    Learning Centre
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('dictionary');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-charcoal font-medium"
                  >
                    Sign Dictionary
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-charcoal uppercase tracking-wider block font-mono">
                Languages
              </span>
              <ul className="space-y-1.5 text-charcoal-muted">
                <li>
                  <button
                    onClick={() => handleExploreLanguage('ISL')}
                    className="hover:text-charcoal font-medium"
                  >
                    Indian Sign Language
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleExploreLanguage('BSL')}
                    className="hover:text-charcoal font-medium"
                  >
                    British Sign Language
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleExploreLanguage('ASL')}
                    className="hover:text-charcoal font-medium"
                  >
                    American Sign Language
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-charcoal uppercase tracking-wider block font-mono">
                Project
              </span>
              <ul className="space-y-1.5 text-charcoal-muted">
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('about');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-charcoal font-medium"
                  >
                    About iNSIGHT
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-charcoal font-medium"
                  >
                    Accessibility Settings
                  </button>
                </li>
                <li>
                  <a
                    href="https://github.com/sukrutdusane/insight"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-charcoal font-medium inline-flex items-center space-x-1"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-charcoal/10 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-muted gap-2">
          <span>© 2026 iNSIGHT • Communication without barriers.</span>
          <span>Crafted with pastel neo-brutalism & Google Gemma 4.</span>
        </div>
      </footer>
    </div>
  </div>
);
};
