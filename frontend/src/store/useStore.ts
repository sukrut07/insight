import { create } from 'zustand';
import {
  ActiveTab,
  ModelStatus,
  RefinedTranslation,
  HistoryItem,
  MultimodalInspectionResult,
  GemmaEvaluationStats,
  DisagreementEvent,
  SignLanguageId,
  VisualIdentificationResult,
  AccessibilitySettings,
} from '../types';

interface AppState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // SignBridge 2.0 Multilingual Selection
  activeLanguage: SignLanguageId;
  setActiveLanguage: (lang: SignLanguageId) => void;

  // Visual Identification
  visualIdentification: VisualIdentificationResult | null;
  setVisualIdentification: (res: VisualIdentificationResult | null) => void;

  // Accessibility Settings
  accessibility: AccessibilitySettings;
  updateAccessibility: (partial: Partial<AccessibilitySettings>) => void;

  // Live recognition stream
  currentLabel: string;
  rawLabel: string;
  confidence: number;
  isStable: boolean;
  handsDetected: number;
  leftHand: boolean;
  rightHand: boolean;
  fps: number;
  latencyMs: number;
  annotatedFrame: string | null;

  // Sentence building
  sentenceTokens: { word: string; confidence: number; timestamp: number }[];
  addToken: (word: string, confidence: number) => void;
  removeToken: (index: number) => void;
  clearTokens: () => void;
  updateTokenWord: (index: number, newWord: string) => void;

  // Translation refinement
  refinedTranslation: RefinedTranslation | null;
  setRefinedTranslation: (trans: RefinedTranslation | null) => void;
  isRefining: boolean;
  setIsRefining: (loading: boolean) => void;

  // Multimodal Gesture Inspection (Layer 2)
  multimodalResult: MultimodalInspectionResult | null;
  setMultimodalResult: (res: MultimodalInspectionResult | null) => void;
  isInspecting: boolean;
  setIsInspecting: (loading: boolean) => void;
  snapshotFrame: string | null;
  setSnapshotFrame: (frame: string | null) => void;

  // Gemma Evaluation Dashboard & Disagreement Tracking
  gemmaEvaluation: GemmaEvaluationStats | null;
  setGemmaEvaluation: (stats: GemmaEvaluationStats | null) => void;
  disagreements: DisagreementEvent[];
  setDisagreements: (list: DisagreementEvent[]) => void;
  activeProvider: string;
  setActiveProvider: (provider: string) => void;
  cloudConsent: boolean;
  setCloudConsent: (consent: boolean) => void;

  // Model & Diagnostics
  modelStatus: ModelStatus | null;
  setModelStatus: (status: ModelStatus | null) => void;

  // History
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;

  // Camera & recognition controls
  isWebcamActive: boolean;
  setIsWebcamActive: (active: boolean) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;

  // Feedback modal
  feedbackSign: string | null;
  openFeedbackModal: (sign: string) => void;
  closeFeedbackModal: () => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeLanguage: 'ISL',
  setActiveLanguage: (lang) => set({ activeLanguage: lang }),

  visualIdentification: null,
  setVisualIdentification: (res) => set({ visualIdentification: res }),

  accessibility: {
    largeText: false,
    highContrast: false,
    fontSizeScale: 1.0,
    speechOutput: false,
    speechRate: 175,
    reducedMotion: false,
    visualAlerts: true,
    showLandmarksOverlay: true,
  },
  updateAccessibility: (partial) =>
    set((state) => ({ accessibility: { ...state.accessibility, ...partial } })),

  currentLabel: 'NONE',
  rawLabel: 'NONE',
  confidence: 0,
  isStable: false,
  handsDetected: 0,
  leftHand: false,
  rightHand: false,
  fps: 0,
  latencyMs: 0,
  annotatedFrame: null,

  sentenceTokens: [],
  addToken: (word, confidence) =>
    set((state) => {
      // Avoid duplicate consecutive identical additions within last token
      const last = state.sentenceTokens[state.sentenceTokens.length - 1];
      if (last && last.word === word) return state;
      return {
        sentenceTokens: [
          ...state.sentenceTokens,
          { word, confidence, timestamp: Date.now() },
        ],
      };
    }),
  removeToken: (index) =>
    set((state) => ({
      sentenceTokens: state.sentenceTokens.filter((_, i) => i !== index),
    })),
  clearTokens: () => set({ sentenceTokens: [], refinedTranslation: null }),
  updateTokenWord: (index, newWord) =>
    set((state) => {
      const updated = [...state.sentenceTokens];
      if (updated[index]) {
        updated[index] = { ...updated[index], word: newWord };
      }
      return { sentenceTokens: updated };
    }),

  refinedTranslation: null,
  setRefinedTranslation: (refinedTranslation) => set({ refinedTranslation }),
  isRefining: false,
  setIsRefining: (isRefining) => set({ isRefining }),

  // Multimodal state
  multimodalResult: null,
  setMultimodalResult: (multimodalResult) => set({ multimodalResult }),
  isInspecting: false,
  setIsInspecting: (isInspecting) => set({ isInspecting }),
  snapshotFrame: null,
  setSnapshotFrame: (snapshotFrame) => set({ snapshotFrame }),

  // Gemma Evaluation
  gemmaEvaluation: null,
  setGemmaEvaluation: (gemmaEvaluation) => set({ gemmaEvaluation }),
  disagreements: [],
  setDisagreements: (disagreements) => set({ disagreements }),
  activeProvider: 'local_ollama',
  setActiveProvider: (activeProvider) => set({ activeProvider }),
  cloudConsent: false,
  setCloudConsent: (cloudConsent) => set({ cloudConsent }),

  modelStatus: null,
  setModelStatus: (modelStatus) => set({ modelStatus }),

  history: [],
  setHistory: (history) => set({ history }),

  isWebcamActive: true,
  setIsWebcamActive: (isWebcamActive) => set({ isWebcamActive }),
  isPaused: false,
  setIsPaused: (isPaused) => set({ isPaused }),

  feedbackSign: null,
  openFeedbackModal: (sign) => set({ feedbackSign: sign }),
  closeFeedbackModal: () => set({ feedbackSign: null }),
}));
