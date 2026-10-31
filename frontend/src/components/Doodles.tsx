import React from 'react';

export const SmileyDoodle: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <div className={`${className} relative inline-block`}>
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[3px_3px_0px_#242424]">
      <circle cx="32" cy="32" r="30" fill="#FFFFFF" stroke="#242424" strokeWidth="2.5" />
      <circle cx="23" cy="25" r="2.5" fill="#242424" />
      <circle cx="41" cy="25" r="2.5" fill="#242424" />
      <path d="M 22 38 Q 32 48 42 38" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

export const SparkleDoodle: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
      fill="#F9E9B7"
      stroke="#242424"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
  </svg>
);

export const CurvedArrowDoodle: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M 8 10 C 25 8, 30 25, 20 32"
      stroke="#242424"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="1 0"
    />
    <path d="M 26 26 L 20 32 L 25 36" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HandLineArt: React.FC<{ type?: 'hello' | 'help' | 'ily'; className?: string }> = ({
  type = 'ily',
  className = 'w-36 h-36',
}) => (
  <div className={`${className} flex items-center justify-center`}>
    {type === 'ily' && (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Palm & Wrist */}
        <path
          d="M 40 110 L 40 70 C 40 60, 48 50, 56 50 C 64 50, 70 56, 70 66 L 70 80"
          stroke="#242424"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Index Finger Extended */}
        <path d="M 48 60 L 48 25 C 48 20, 56 20, 56 25 L 56 60" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        {/* Pinky Finger Extended */}
        <path d="M 80 75 L 80 40 C 80 35, 88 35, 88 40 L 88 80" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        {/* Thumb Extended */}
        <path d="M 40 78 C 30 74, 20 68, 22 60 C 24 54, 30 62, 38 68" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        {/* Curled Middle & Ring */}
        <path d="M 58 60 C 58 48, 68 48, 68 62" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 69 62 C 69 50, 79 50, 79 66" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        {/* Movement arrow loop */}
        <path d="M 45 88 Q 60 102 75 88" stroke="#242424" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 72 94 L 75 88 L 68 87" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}

    {type === 'hello' && (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Open Palm Waving */}
        <path d="M 50 110 L 50 75 C 50 68, 54 65, 58 65 L 58 35 C 58 30, 64 30, 64 35 L 64 65" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 64 65 L 64 25 C 64 20, 70 20, 70 25 L 70 65" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 70 65 L 70 28 C 70 23, 76 23, 76 28 L 76 68" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 76 68 L 76 40 C 76 35, 82 35, 82 40 L 82 85 C 82 98, 70 110, 50 110" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 50 82 C 40 80, 32 72, 34 65 C 36 60, 42 66, 50 72" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        {/* Waving dashes */}
        <path d="M 28 45 Q 32 35 28 25" stroke="#242424" strokeWidth="2" strokeLinecap="round" />
        <path d="M 92 25 Q 88 35 92 45" stroke="#242424" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )}

    {type === 'help' && (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Base flat hand */}
        <rect x="25" y="80" width="70" height="14" rx="7" fill="#C8E9F7" stroke="#242424" strokeWidth="2.5" />
        {/* Upright fist on palm */}
        <rect x="48" y="45" width="26" height="32" rx="8" fill="#F8CFD0" stroke="#242424" strokeWidth="2.5" />
        <path d="M 54 45 L 54 28 C 54 24, 60 24, 60 28 L 60 45" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        {/* Upward lifting arrow */}
        <path d="M 98 85 L 98 50" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 92 56 L 98 50 L 104 56" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);
