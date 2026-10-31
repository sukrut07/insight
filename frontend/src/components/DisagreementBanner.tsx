import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { resolveDisagreement } from '../services/api';
import { AlertTriangle } from 'lucide-react';

export const DisagreementBanner: React.FC = () => {
  const { multimodalResult, setMultimodalResult, currentLabel, openFeedbackModal } = useStore();
  const [isResolving, setIsResolving] = useState(false);

  if (!multimodalResult || !multimodalResult.discrepancy_detected) {
    return null;
  }

  const handleAction = async (action: 'confirm_classifier' | 'confirm_gemma', suggested?: string) => {
    setIsResolving(true);
    try {
      await resolveDisagreement({
        event_id: 'active_session',
        action,
        corrected_label: suggested || currentLabel,
      });
      // Dismiss banner after handling
      setMultimodalResult({
        ...multimodalResult,
        discrepancy_detected: false,
        flag_for_review: false,
      });
    } catch (err) {
      console.error('Failed to resolve disagreement:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const suggestedAlternative = multimodalResult.suggested_alternatives?.[0] || 'REVIEW';

  return (
    <div className="neo-card bg-pastel-yellow p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white border-2 border-charcoal flex items-center justify-center shrink-0 shadow-hard-xs">
            <AlertTriangle className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h4 className="text-sm font-black font-display text-charcoal flex items-center space-x-2">
              <span>Recognition Disagreement Detected</span>
              <span className="neo-pill bg-white text-charcoal text-[10px] font-bold">
                Review Required
              </span>
            </h4>
            <p className="text-xs text-charcoal">
              The classifier predicted <span className="font-bold font-mono">{currentLabel}</span>, but Gemma's visual reasoning observes contradictory posture.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button
            disabled={isResolving}
            onClick={() => handleAction('confirm_classifier')}
            className="neo-btn bg-white hover:bg-cream-100 text-charcoal px-3 py-1.5 text-xs font-bold"
          >
            Confirm {currentLabel}
          </button>

          {suggestedAlternative && suggestedAlternative !== 'REVIEW' && (
            <button
              disabled={isResolving}
              onClick={() => handleAction('confirm_gemma', suggestedAlternative)}
              className="neo-btn bg-pastel-mint hover:bg-pastel-yellow text-charcoal px-3 py-1.5 text-xs font-bold"
            >
              Accept {suggestedAlternative}
            </button>
          )}

          <button
            onClick={() => openFeedbackModal(currentLabel)}
            className="neo-btn bg-charcoal hover:bg-charcoal/90 text-white px-3 py-1.5 text-xs font-bold"
          >
            Manual Correction
          </button>
        </div>
      </div>

      {multimodalResult.discrepancy_details && (
        <div className="px-3 py-2 rounded-xl bg-white border-2 border-charcoal text-[11px] text-charcoal font-mono">
          {multimodalResult.discrepancy_details}
        </div>
      )}
    </div>
  );
};
