/**
 * Static multilingual workbook data for ISL, ASL, and BSL.
 *
 * Provides instant zero-latency loading and reliable offline/Vercel support for:
 * - Complete A-Z Fingerspelling Alphabets (26 classes per language)
 * - Numbers (1-10)
 * - Foundational vocabulary signs
 */

import islData from './languages/isl.json';
import aslData from './languages/asl.json';
import bslData from './languages/bsl.json';

export interface AlphabetCard {
  letter: string;
  hands: number;
  description: string;
  orientation: string;
  tip?: string;
}

export interface NumberCard {
  number: string;
  hands: number;
  description: string;
  orientation: string;
}

export interface VocabularyCard {
  id: number;
  label: string;
  category: string;
  hands: number;
  description: string;
  hand_orientation?: string;
  start_position?: string;
  end_position?: string;
}

export interface LanguageWorkbookData {
  language_id: string;
  name: string;
  alphabet: AlphabetCard[];
  numbers: NumberCard[];
  vocabulary: VocabularyCard[];
}

export const WORKBOOK_STATIC_DATA: Record<string, LanguageWorkbookData> = {
  ISL: {
    language_id: 'ISL',
    name: islData.name,
    alphabet: (islData.alphabet || []) as AlphabetCard[],
    numbers: (islData.numbers || []) as NumberCard[],
    vocabulary: (islData.vocabulary || []) as VocabularyCard[],
  },
  ASL: {
    language_id: 'ASL',
    name: aslData.name,
    alphabet: (aslData.alphabet || []) as AlphabetCard[],
    numbers: (aslData.numbers || []) as NumberCard[],
    vocabulary: (aslData.vocabulary || []) as VocabularyCard[],
  },
  BSL: {
    language_id: 'BSL',
    name: bslData.name,
    alphabet: (bslData.alphabet || []) as AlphabetCard[],
    numbers: (bslData.numbers || []) as NumberCard[],
    vocabulary: (bslData.vocabulary || []) as VocabularyCard[],
  },
};
