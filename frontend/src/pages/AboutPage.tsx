import React from 'react';
import { useStore } from '../store/useStore';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Eye,
  GitBranch,
  ExternalLink,
  BookOpen,
  Camera,
  Heart,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setActiveTab } = useStore();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="neo-card bg-pastel-mint p-8 sm:p-12 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="neo-pill bg-white text-charcoal text-xs font-bold">
            About the Project
          </span>
          <span className="neo-pill bg-pastel-yellow text-charcoal text-xs font-bold">
            Open-Source AI • Google Gemma 4
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-display text-charcoal tracking-tight">
          About iNSIGHT.
        </h1>
        <p className="text-base sm:text-lg text-charcoal max-w-2xl leading-relaxed">
          iNSIGHT is an open-source, local-first multimodal sign language communication assistant. We combine computer vision with Google's Gemma 4 models to make sign-language understanding intuitive, fluid, and universally accessible.
        </p>
      </div>

      {/* Mission & Problem */}
      <div className="neo-card bg-white p-8 space-y-6">
        <h2 className="text-2xl font-black font-display text-charcoal">
          The Problem We Are Solving
        </h2>
        <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
          Over 70 million deaf individuals worldwide use sign languages as their primary mode of communication. Yet conventional translation tools fail because sign languages are not spoken word substitutes. They are complete, expressive natural languages featuring multidimensional hand configurations, spatial grammar, and facial dynamics.
        </p>
        <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
          Traditional AI dashboards feel clinical and cold. <strong>iNSIGHT</strong> takes inspiration from playful, human-centered editorial design to create an encouraging environment for learning, practice, and live conversation.
        </p>
      </div>

      {/* Three Languages Supported */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black font-display text-charcoal">
          Three Independent Sign Languages
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neo-card bg-pastel-mint p-6 space-y-3">
            <span className="text-3xl">🇮🇳</span>
            <h3 className="text-xl font-bold font-display text-charcoal">ISL</h3>
            <p className="text-xs font-bold text-charcoal-muted">Indian Sign Language</p>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Two-handed fingerspelling system with distinct spatial syntax used by millions across South Asia.
            </p>
          </div>

          <div className="neo-card bg-pastel-pink p-6 space-y-3">
            <span className="text-3xl">🇬🇧</span>
            <h3 className="text-xl font-bold font-display text-charcoal">BSL</h3>
            <p className="text-xs font-bold text-charcoal-muted">British Sign Language</p>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Rich two-handed manual alphabet from the BANZSL family with topic-comment structure.
            </p>
          </div>

          <div className="neo-card bg-pastel-blue p-6 space-y-3">
            <span className="text-3xl">🇺🇸</span>
            <h3 className="text-xl font-bold font-display text-charcoal">ASL</h3>
            <p className="text-xs font-bold text-charcoal-muted">American Sign Language</p>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              One-handed manual alphabet derived from Old French Sign Language with rich classifier predicates.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="neo-card bg-white p-8 space-y-6">
        <h2 className="text-2xl font-black font-display text-charcoal">
          Architecture: CV + Gemma 4 Separation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-charcoal-muted">
          <div className="p-4 rounded-2xl bg-cream-100 border-2 border-charcoal space-y-2">
            <span className="font-bold text-charcoal text-sm block">1. Computer Vision Layer</span>
            <p>
              MediaPipe extracts 553 landmarks across hands, pose, and face. Dedicated classification models identify supported signs at low latency.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-100 border-2 border-charcoal space-y-2">
            <span className="font-bold text-charcoal text-sm block">2. Language Reasoning Layer</span>
            <p>
              Google Gemma 4 E4B via Ollama orchestrates the raw tokens into fluid, grammatically natural spoken English, avoiding literal word-salad translations.
            </p>
          </div>
        </div>
      </div>

      {/* Open Source & Links */}
      <div className="neo-card bg-pastel-lavender p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-black font-display text-charcoal">
            Built Open Source for the Community
          </h3>
          <p className="text-xs text-charcoal-muted">
            Inspect our models, reproducible training scripts, and client code on GitHub.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/sukrutdusane/insight"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn bg-charcoal text-white hover:bg-charcoal/90 px-6 py-2.5 text-xs font-bold flex items-center space-x-2"
          >
            <GitBranch className="w-4 h-4 text-pastel-mint" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setActiveTab('gesture-lab')}
            className="neo-btn bg-white hover:bg-cream-100 text-charcoal px-6 py-2.5 text-xs font-bold flex items-center space-x-2"
          >
            <span>Try Gesture Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
