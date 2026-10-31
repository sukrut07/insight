import React from 'react';
import { useStore } from '../store/useStore';
import {
  ShieldCheck,
  Zap,
  Volume2,
  Cpu,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Database,
  Award,
  Video,
  Play,
  RotateCcw,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = useStore();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-16">
      {/* Hero Header with Exact Project Description and Tagline */}
      <section className="text-center space-y-6 pt-4">
        {/* Dual Hacktoberfest 2026 Target Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-cyan/15 border border-brand-cyan/35 text-brand-cyan text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target: Best Use of Gemma 4</span>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-xs font-semibold shadow-sm">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Target: Best Open-Source AI Project</span>
          </div>
        </div>

        {/* Project Title & Tagline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Breaking communication barriers through <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-teal-400 to-emerald-400">multimodal, open-weight AI</span>.
          </h1>
          <p className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold">
            SignBridge • AI-Powered Multimodal Sign Language Communication Assistant
          </p>
        </div>

        {/* Exact Project Description */}
        <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
          "SignBridge is a local-first, multimodal AI-powered Indian Sign Language communication assistant combining computer vision, locally trained gesture-recognition models, and Google's open-weight Gemma 4 models. It translates supported sign-language gestures into readable and audible communication while using multimodal visual reasoning and contextual language intelligence to assist recognition and improve accessibility."
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setActiveTab('translator')}
            className="flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-teal-500 text-dark-950 font-bold text-sm shadow-xl shadow-brand-cyan/25 hover:shadow-brand-cyan/40 hover:scale-[1.02] transition-all"
          >
            <span>Launch Live Multimodal Translator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('gemma')}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl glass-panel text-slate-200 font-semibold text-sm hover:bg-slate-800/80 transition-all border border-slate-700/80"
          >
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>Gemma 4 Multimodal Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className="px-6 py-3.5 rounded-xl glass-panel text-slate-300 font-semibold text-sm hover:bg-slate-800/80 transition-all border border-slate-700/80"
          >
            Open-Source Dataset Studio
          </button>
        </div>
      </section>

      {/* 3-Layer AI Architecture Breakdown */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-white">Three-Layer Multimodal AI Architecture</h2>
          <p className="text-xs text-slate-400">
            Engineered so Gemma 4 performs genuine visual reasoning and contextual language intelligence, not just optional text grammar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Layer 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-brand-cyan/40 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-brand-cyan flex items-center justify-center font-black">
              L1
            </div>
            <span className="text-xs font-mono text-brand-cyan font-bold block">Layer 1 • Visual Perception</span>
            <h3 className="text-base font-bold text-white">MediaPipe + Computer Vision</h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>21 3D landmarks ($X, Y, Z$) extracted per hand in real-time.</li>
              <li>Wrist-origin translation and distance scale normalization.</li>
              <li>Static Random Forest + 30-frame temporal Bidirectional LSTM.</li>
              <li>Rolling majority smoothing with hysteresis stability thresholding.</li>
            </ul>
          </div>

          {/* Layer 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-brand-purple flex items-center justify-center font-black">
              L2
            </div>
            <span className="text-xs font-mono text-brand-purple font-bold block">Layer 2 • Multimodal Intelligence</span>
            <h3 className="text-base font-bold text-white">Gemma 4 E4B Visual Reasoning</h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Analyzes stabilized webcam hand images alongside landmark predictions.</li>
              <li>Assesses whether visual evidence is consistent with classifier labels.</li>
              <li>Discrepancy detection & uncertainty explanation.</li>
              <li>Suggests context-aware interpretations from verified ISL vocabulary.</li>
            </ul>
          </div>

          {/* Layer 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
              L3
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold block">Layer 3 • Language Intelligence</span>
            <h3 className="text-base font-bold text-white">Gemma 4 + Translation Engine</h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Transforms ISL SOV sign token sequences into natural English sentences.</li>
              <li>Provides alternative phrasings and grammatical transformation notes.</li>
              <li>Structured JSON output with offline passthrough fallback.</li>
              <li>Zero-cloud macOS native speech synthesis for instant audio playback.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* The 90-Second Judging Demonstration Guide */}
      <section className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Play className="w-5 h-5 text-brand-cyan fill-current" />
            <span>The 90-Second SignBridge Judging Demonstration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step walkthrough proving both Best Use of Gemma 4 and Best Open-Source AI Project.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
            <span className="font-mono text-brand-cyan font-bold block">0–15s</span>
            <span className="font-bold text-white block">The Problem</span>
            <p className="text-slate-400 text-[11px]">Communication barrier faced by Deaf community; introducing SignBridge.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
            <span className="font-mono text-brand-cyan font-bold block">15–30s</span>
            <span className="font-bold text-white block">Computer Vision</span>
            <p className="text-slate-400 text-[11px]">Perform ISL sign; show MediaPipe 3D landmarks & classifier prediction.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
            <span className="font-mono text-brand-purple font-bold block">30–50s</span>
            <span className="font-bold text-white block">Gemma Multimodal</span>
            <p className="text-slate-400 text-[11px]">Pass selected hand image to Gemma; show visual observations & consistency check.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
            <span className="font-mono text-emerald-400 font-bold block">50–65s</span>
            <span className="font-bold text-white block">Language Engine</span>
            <p className="text-slate-400 text-[11px]">Demonstrate sentence refinement, grammar reasoning, and text-to-speech.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
            <span className="font-mono text-teal-400 font-bold block">65–80s</span>
            <span className="font-bold text-white block">Open-Source AI</span>
            <p className="text-slate-400 text-[11px]">Show dataset collector, vocabulary plugin system, and training pipeline.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
            <span className="font-mono text-brand-cyan font-bold block">80–90s</span>
            <span className="font-bold text-white block">Local Inference</span>
            <p className="text-slate-400 text-[11px]">Show Ollama runtime, local Gemma weights, and complete offline capability.</p>
          </div>
        </div>
      </section>

      {/* Privacy & Cloud Distinction Guarantee */}
      <section className="glass-panel rounded-3xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy-First Architecture</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Local Inference by Default • Zero Unconsented Telemetry
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Camera frames and personal gesture data remain strictly local on your machine. The hosted Gemini API prototype mode is strictly opt-in with explicit user consent.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('translator')}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-cyan text-dark-950 font-bold text-xs hover:bg-teal-400 transition shrink-0"
          >
            <span>Try Live Translation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
