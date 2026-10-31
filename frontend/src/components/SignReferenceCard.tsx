import React from 'react';
import { SignIllustration } from './SignIllustration';
import { SignReferenceItem, SignLanguageId } from '../types';
import { PlayCircle, Compass, MapPin, Hand, ArrowRight } from 'lucide-react';

interface SignReferenceCardProps {
  sign: SignReferenceItem;
  language: SignLanguageId;
  onPractice?: (sign: SignReferenceItem) => void;
  isRecognizedInActiveModel?: boolean;
}

export const SignReferenceCard: React.FC<SignReferenceCardProps> = ({
  sign,
  language,
  onPractice,
  isRecognizedInActiveModel = true,
}) => {
  return (
    <div className="neo-card bg-white p-5 flex flex-col justify-between hover:-translate-y-1 transition-all">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="neo-pill bg-pastel-yellow text-charcoal text-[10px] font-bold uppercase">
              {sign.category || 'General'}
            </span>
            <h3 className="text-lg font-black font-display text-charcoal tracking-wide mt-1">
              {sign.label.replace('_', ' ')}
            </h3>
          </div>
          <span
            className={`neo-pill text-[10px] font-bold ${
              isRecognizedInActiveModel
                ? 'bg-pastel-mint text-charcoal'
                : 'bg-pastel-pink text-charcoal'
            }`}
          >
            {isRecognizedInActiveModel ? 'Recognized' : 'Visual Ref'}
          </span>
        </div>

        {/* Illustration */}
        <div className="flex justify-center mb-3 p-3 bg-cream-100 rounded-2xl border-2 border-charcoal/20">
          <SignIllustration
            label={sign.label}
            language={language}
            hands={sign.hands}
            type={sign.type}
            category={sign.category}
            size="md"
          />
        </div>

        {/* Description & Linguistic Guidance */}
        <p className="text-xs text-charcoal-muted line-clamp-2 mb-3 min-h-[32px] leading-relaxed">
          {sign.description}
        </p>

        {/* Detailed Mechanics Grid */}
        <div className="space-y-1.5 text-[11px] bg-cream-100 border-2 border-charcoal rounded-xl p-3 mb-3 font-mono">
          <div className="flex items-center text-charcoal">
            <Compass className="w-3.5 h-3.5 mr-1.5 text-purple-700 flex-shrink-0" />
            <span className="text-charcoal-muted mr-1 font-bold">Orientation:</span>
            <span className="text-charcoal truncate font-medium">
              {sign.hand_orientation || 'Natural palm posture'}
            </span>
          </div>

          <div className="flex items-center text-charcoal">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-700 flex-shrink-0" />
            <span className="text-charcoal-muted mr-1 font-bold">Start:</span>
            <span className="text-charcoal truncate font-medium">
              {sign.start_position || 'Chest / neutral position'}
            </span>
          </div>

          <div className="flex items-center text-charcoal">
            <ArrowRight className="w-3.5 h-3.5 mr-1.5 text-emerald-700 flex-shrink-0" />
            <span className="text-charcoal-muted mr-1 font-bold">End:</span>
            <span className="text-charcoal truncate font-medium">
              {sign.end_position || 'Release to neutral'}
            </span>
          </div>
        </div>
      </div>

      {/* Practice Button */}
      {onPractice && (
        <button
          type="button"
          onClick={() => onPractice(sign)}
          className="neo-btn bg-pastel-mint hover:bg-pastel-yellow text-charcoal w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-2"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Practice in Front of Camera</span>
        </button>
      )}
    </div>
  );
};
