import React from 'react';

interface SignIllustrationProps {
  label: string;
  language: string;
  hands?: number;
  type?: 'static' | 'dynamic';
  category?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SignIllustration: React.FC<SignIllustrationProps> = ({
  label,
  language,
  hands = 1,
  type = 'dynamic',
  size = 'md',
}) => {
  const isTwoHanded = hands === 2;

  const dims = {
    sm: 'w-24 h-24',
    md: 'w-44 h-44',
    lg: 'w-60 h-60',
  }[size];

  // Render contextual vectors based on sign type
  return (
    <div
      className={`${dims} relative bg-dark-950/70 border border-slate-800 rounded-2xl flex items-center justify-center p-3 overflow-hidden shadow-inner group`}
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent pointer-events-none" />

      {/* SVG Manual Illustration */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full text-slate-300 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Silhouette Head & Shoulders Guide */}
        <circle cx="100" cy="55" r="28" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
        <path
          d="M 50 145 C 50 100, 150 100, 150 145"
          stroke="#334155"
          strokeWidth="2"
          strokeDasharray="3 3"
        />

        {/* Hand Graphic Variations */}
        {label === 'HELLO' && (
          <g transform="translate(10, 0)">
            {/* Hand at temple */}
            <rect x="120" y="35" width="22" height="35" rx="10" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" />
            <path d="M 125 35 L 125 20 M 132 35 L 132 16 M 139 35 L 139 22" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
            {/* Outward arc arrow */}
            <path d="M 145 35 Q 170 50 160 85" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none" markerEnd="url(#arrow)" />
          </g>
        )}

        {label === 'GOODBYE' && (
          <g>
            <rect x="88" y="55" width="24" height="35" rx="8" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" />
            <path d="M 93 55 L 93 40 M 100 55 L 100 36 M 107 55 L 107 42" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
            {/* Wave oscillation arrows */}
            <path d="M 75 70 Q 82 60 75 50" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 125 50 Q 118 60 125 70" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {label === 'THANK_YOU' && (
          <g>
            {/* Hand at chin */}
            <circle cx="100" cy="78" r="8" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
            <rect x="90" y="80" width="20" height="28" rx="8" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" />
            {/* Forward outward arc */}
            <path d="M 100 108 L 100 148" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" markerEnd="url(#arrow)" />
          </g>
        )}

        {label === 'PLEASE' && (
          <g>
            {/* Hand flat on chest */}
            <rect x="88" y="105" width="24" height="30" rx="8" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" />
            {/* Circular motion arrow */}
            <path
              d="M 100 90 A 25 25 0 1 1 99 90"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              fill="none"
              markerEnd="url(#arrow)"
            />
          </g>
        )}

        {label === 'HELP' && (
          <g>
            {/* Non-dominant flat base hand */}
            <rect x="70" y="130" width="60" height="12" rx="6" fill="#3b82f6" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="2.5" />
            {/* Dominant fist with thumb up */}
            <rect x="88" y="100" width="24" height="28" rx="7" fill="#06b6d4" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="2.5" />
            <line x1="94" y1="100" x2="94" y2="82" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
            {/* Upward lifting motion arrow */}
            <path d="M 140 135 L 140 95" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" markerEnd="url(#arrow)" />
          </g>
        )}

        {label === 'YES' && (
          <g>
            {/* S-fist nodding */}
            <rect x="88" y="85" width="24" height="28" rx="7" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" />
            {/* Nodding downward arrow */}
            <path d="M 120 85 Q 128 100 120 115" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" markerEnd="url(#arrow)" fill="none" />
          </g>
        )}

        {label === 'NO' && (
          <g>
            {/* Fingers snap */}
            <circle cx="100" cy="100" r="14" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" />
            <path d="M 85 92 L 100 100 M 85 108 L 100 100" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {label === 'WATER' && (
          <g>
            {/* W-handshape at mouth */}
            <path d="M 90 95 L 90 70 M 97 95 L 97 65 M 104 95 L 104 68 M 111 95 L 111 74" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="80" r="4" fill="#38bdf8" />
          </g>
        )}

        {label === 'FOOD' && (
          <g>
            {/* Clustered fingertips to mouth */}
            <polygon points="90,115 110,115 100,85" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 100 115 L 100 135" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrow)" />
          </g>
        )}

        {/* Default fallback for other signs / letters */}
        {!['HELLO', 'GOODBYE', 'THANK_YOU', 'PLEASE', 'HELP', 'YES', 'NO', 'WATER', 'FOOD'].includes(label) && (
          <g>
            <rect x="85" y="80" width="30" height="38" rx="8" fill="#06b6d4" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="2" />
            <text x="100" y="104" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="bold">
              {label.slice(0, 3)}
            </text>
            {type === 'dynamic' && (
              <path d="M 125 80 Q 135 95 125 110" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
            )}
          </g>
        )}

        {/* Arrow Marker Definition */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" />
          </marker>
        </defs>
      </svg>

      {/* Floating Badges */}
      <div className="absolute top-2 left-2 flex items-center space-x-1">
        <span className="text-[10px] font-mono font-bold bg-dark-900/80 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
          {language}
        </span>
        <span
          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
            isTwoHanded
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isTwoHanded ? '2 Hands' : '1 Hand'}
        </span>
      </div>

      <div className="absolute bottom-2 right-2">
        <span className="text-[9px] font-mono uppercase bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded">
          {type}
        </span>
      </div>
    </div>
  );
};
