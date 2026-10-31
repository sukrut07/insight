import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Cpu,
  Brain,
  CheckCircle,
  HelpCircle,
  Sun,
  Maximize2,
  Compass,
  Film,
  Globe2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const RecognitionExplanationPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      num: '01',
      title: 'Camera Capture',
      desc: 'The webcam captures video frames at 25-30 FPS strictly after explicit user permission.',
      icon: <Camera className="w-4 h-4 text-charcoal" />,
      badge: 'Client RAM',
      color: 'bg-pastel-mint',
    },
    {
      num: '02',
      title: 'Landmark Extraction',
      desc: 'MediaPipe detects 21 hand landmarks per hand, tracking joints, wrist, and palm coordinates.',
      icon: <Layers className="w-4 h-4 text-charcoal" />,
      badge: 'MediaPipe',
      color: 'bg-pastel-blue',
    },
    {
      num: '03',
      title: 'Feature Normalisation',
      desc: 'Translates wrist to (0,0,0), normalises scale by middle MCP distance, and computes PIP/DIP joint angles.',
      icon: <Cpu className="w-4 h-4 text-charcoal" />,
      badge: '148D Canonical Vector',
      color: 'bg-pastel-lavender',
    },
    {
      num: '04',
      title: 'Language Model Inference',
      desc: 'Language-specific classifier (Static Random Forest or 30-frame BiLSTM) infers the gesture class.',
      icon: <Brain className="w-4 h-4 text-charcoal" />,
      badge: 'Dedicated Model',
      color: 'bg-pastel-yellow',
    },
    {
      num: '05',
      title: 'Confidence & Dictionary',
      desc: 'Calibrated confidence gating routes to High (>=75%), Medium (45-75%), or Low (<45% "Not recognised").',
      icon: <CheckCircle className="w-4 h-4 text-charcoal" />,
      badge: 'Gated Mapping',
      color: 'bg-pastel-pink',
    },
  ];

  const physicsFactors = [
    {
      icon: <Sun className="w-4 h-4 text-amber-600" />,
      title: 'Lighting & Contrast',
      text: 'Backlighting or direct sunlight behind you obscures hand silhouettes. Soft frontal lighting provides the highest landmark confidence.',
    },
    {
      icon: <Maximize2 className="w-4 h-4 text-blue-600" />,
      title: 'Camera Distance',
      text: 'Position hands 1.5–3 feet from the lens. Both hands and face should remain completely inside the video viewport.',
    },
    {
      icon: <Compass className="w-4 h-4 text-emerald-600" />,
      title: 'Palm Orientation',
      text: 'Signs like HELLO vs OPEN PALM differ by inward/outward palm orientation and tilt angles relative to the camera.',
    },
    {
      icon: <Film className="w-4 h-4 text-purple-600" />,
      title: 'Dynamic Trajectory',
      text: 'Signs like THANK YOU and GOODBYE are continuous gestures requiring 15–30 frames of movement, not a single frozen pose.',
    },
    {
      icon: <Globe2 className="w-4 h-4 text-teal-600" />,
      title: 'Language Independence',
      text: 'ISL, BSL, and ASL possess distinct grammars and alphabets. A sign in ASL cannot be used as ground truth in ISL or BSL.',
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      title: 'Uncertainty Gating',
      text: 'Low confidence gestures are transparently reported as "Sign not recognised" rather than making false random guesses.',
    },
  ];

  return (
    <div className="neo-card bg-white p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-charcoal">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-pastel-lavender border-2 border-charcoal flex items-center justify-center shadow-hard-xs">
            <HelpCircle className="w-4 h-4 text-charcoal" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-charcoal">
              How Recognition Works
            </h3>
            <p className="text-xs text-charcoal-muted">
              5-stage computer vision & neural inference pipeline
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="neo-btn bg-cream-100 hover:bg-cream-200 text-xs px-3 py-1.5 flex items-center space-x-1"
        >
          <span>{isExpanded ? 'Show Less' : 'Full Explanations'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 5-Step Connected Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((s, idx) => (
          <div
            key={s.num}
            className={`p-3.5 rounded-2xl border-2 border-charcoal shadow-hard-xs flex flex-col justify-between ${s.color} transition-transform hover:-translate-y-1`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-charcoal/30 text-charcoal">
                  STEP {s.num}
                </span>
                <div className="w-6 h-6 rounded-lg bg-white border border-charcoal flex items-center justify-center">
                  {s.icon}
                </div>
              </div>
              <h4 className="text-xs font-black font-display text-charcoal mb-1">{s.title}</h4>
              <p className="text-[11px] text-charcoal leading-relaxed">{s.desc}</p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-charcoal/20 text-[9px] font-mono font-bold text-charcoal-muted">
              {s.badge}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Physical & Linguistic Considerations */}
      {isExpanded && (
        <div className="pt-4 border-t-2 border-charcoal/15 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal">
              Why signs may be missed or misclassified
            </h4>
            <span className="text-[10px] text-charcoal-muted font-mono">
              Key physical & environmental constraints
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {physicsFactors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-cream-50 border border-charcoal/30 space-y-1.5"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded bg-white border border-charcoal/30">
                    {factor.icon}
                  </div>
                  <span className="text-xs font-bold text-charcoal">{factor.title}</span>
                </div>
                <p className="text-[11px] text-charcoal-muted leading-relaxed">
                  {factor.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
