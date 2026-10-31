import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchVocabulary, submitFeedback } from '../services/api';
import { VocabularyItem } from '../types';
import { X, Check, AlertTriangle } from 'lucide-react';

export const FeedbackModal: React.FC = () => {
  const { feedbackSign, closeFeedbackModal, confidence } = useStore();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    fetchVocabulary().then(setVocabulary).catch(() => {});
  }, []);

  if (!feedbackSign) return null;

  const handleSubmit = async () => {
    if (!selectedCorrect) return;
    setIsSubmitting(true);
    try {
      await submitFeedback(feedbackSign, selectedCorrect, confidence);
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        closeFeedbackModal();
      }, 1200);
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm">
      <div className="neo-card bg-white w-full max-w-md p-6 relative">
        <button
          onClick={closeFeedbackModal}
          className="absolute top-4 right-4 text-charcoal hover:bg-cream-100 p-1 rounded-lg border-2 border-charcoal/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-pastel-yellow text-charcoal border-2 border-charcoal shadow-hard-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black font-display text-charcoal">Correction & Feedback</h3>
            <p className="text-xs text-charcoal-muted">Save correction locally for offline model improvement</p>
          </div>
        </div>

        {successMessage ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-pastel-mint text-charcoal border-2 border-charcoal flex items-center justify-center shadow-hard-xs">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-charcoal">Correction recorded!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-cream-100 border-2 border-charcoal text-xs space-y-1">
              <span className="text-charcoal-muted block font-bold">Predicted Sign:</span>
              <span className="font-mono font-black text-sm text-charcoal">{feedbackSign}</span>
              <span className="text-[11px] text-charcoal-muted block">
                Confidence: {(confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="correct-sign-select" className="block text-xs font-bold text-charcoal">
                What was the intended sign?
              </label>
              <select
                id="correct-sign-select"
                value={selectedCorrect}
                onChange={(e) => setSelectedCorrect(e.target.value)}
                className="w-full bg-cream-100 border-2 border-charcoal rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:outline-none focus:ring-2 focus:ring-pastel-mint"
              >
                <option value="">Select correct sign...</option>
                {vocabulary.map((v) => (
                  <option key={v.id} value={v.label}>
                    {v.label} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-charcoal">
              <button
                type="button"
                onClick={closeFeedbackModal}
                className="neo-btn bg-white hover:bg-cream-100 text-charcoal px-3 py-1.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedCorrect || isSubmitting}
                onClick={handleSubmit}
                className="neo-btn bg-pastel-mint hover:bg-pastel-yellow text-charcoal px-4 py-1.5 text-xs font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Correction'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
