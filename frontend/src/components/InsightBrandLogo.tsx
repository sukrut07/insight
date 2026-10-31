import React from 'react';

interface InsightBrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const InsightBrandLogo: React.FC<InsightBrandLogoProps> = ({
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Official Hand Outline Logo from User Asset */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-pastel-mint border-2 border-charcoal flex items-center justify-center p-1 shadow-hard-xs transition-transform group-hover:-translate-y-0.5`}
      >
        <img
          src="/insight_logo_icon.png"
          alt="iNSIGHT Logo"
          className="w-full h-full object-contain filter drop-shadow-xs"
        />
      </div>

      {/* Playful & Readable Wordmark */}
      <div className="flex items-baseline space-x-1.5">
        <span
          className={`${textSizes[size]} font-black tracking-tight text-charcoal font-display`}
          style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}
        >
          <span className="text-charcoal lowercase">i</span>
          <span className="text-charcoal uppercase">NSIGHT</span>
        </span>

        {showBadge && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-pastel-yellow border border-charcoal rounded-md shadow-xs">
            2.0
          </span>
        )}
      </div>
    </div>
  );
};
