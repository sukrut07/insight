import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchLanguages, selectLanguage } from '../services/api';
import { SignLanguageId, LanguageMetadata } from '../types';

const FLAGS: Record<SignLanguageId, string> = {
  ISL: '🇮🇳',
  BSL: '🇬🇧',
  ASL: '🇺🇸',
};

export const SignLanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { activeLanguage, setActiveLanguage } = useStore();
  const [languages, setLanguages] = useState<LanguageMetadata[]>([]);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    fetchLanguages()
      .then((data) => {
        if (Array.isArray(data)) {
          setLanguages(data);
        }
      })
      .catch((err) => console.warn('Could not load language metadata:', err));
  }, []);

  const handleSelect = async (langId: SignLanguageId) => {
    if (langId === activeLanguage || isChanging) return;
    setIsChanging(true);
    try {
      await selectLanguage(langId);
      setActiveLanguage(langId);
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center space-x-1.5 p-1 bg-cream-100 border-2 border-charcoal rounded-2xl shadow-hard-xs">
      {(['ISL', 'BSL', 'ASL'] as SignLanguageId[]).map((langId) => {
        const isSelected = activeLanguage === langId;
        const meta = languages.find((l) => l.language_id === langId);
        const isExperimental = meta?.status === 'experimental';

        return (
          <button
            key={langId}
            type="button"
            onClick={() => handleSelect(langId)}
            disabled={isChanging}
            aria-pressed={isSelected}
            title={`${meta?.name || langId} - ${meta?.status || 'Active'}`}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isSelected
                ? 'bg-charcoal text-cream-100 shadow-sm'
                : 'text-charcoal hover:bg-cream-200'
            }`}
          >
            <span className="text-sm">{FLAGS[langId]}</span>
            <span>{langId}</span>
            {isExperimental && !compact && (
              <span
                className={`text-[9px] px-1 py-0.5 rounded font-mono uppercase tracking-wider ${
                  isSelected ? 'bg-white/20 text-cream-100 font-bold' : 'bg-pastel-pink text-charcoal'
                }`}
              >
                Beta
              </span>
            )}
            {meta?.status === 'active' && !compact && (
              <span
                className={`text-[9px] px-1 py-0.5 rounded font-mono uppercase tracking-wider ${
                  isSelected ? 'bg-pastel-mint text-charcoal font-bold' : 'bg-pastel-mint text-charcoal'
                }`}
              >
                Live
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
