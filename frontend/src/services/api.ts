import {
  ModelStatus,
  VocabularyItem,
  RefinedTranslation,
  HistoryItem,
  AnalyticsData,
  MultimodalInspectionResult,
  GemmaEvaluationStats,
  ModelBenchmarkResult,
  DatasetSummary,
} from '../types';

const envApiUrl = (import.meta as any).env?.VITE_API_URL;
export const API_BASE = envApiUrl ? String(envApiUrl).replace(/\/$/, '') + '/api' : '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchModelStatus(): Promise<ModelStatus> {
  const res = await fetch(`${API_BASE}/models/status`);
  return res.json();
}

export async function fetchLanguageModels() {
  const res = await fetch(`${API_BASE}/languages/models`);
  return res.json();
}

export async function fetchProviderStatus() {
  const res = await fetch(`${API_BASE}/gemma/providers`);
  return res.json();
}

export async function fetchVocabulary(): Promise<VocabularyItem[]> {
  const res = await fetch(`${API_BASE}/vocabulary`);
  const data = await res.json();
  return data.signs || data.vocabulary || [];
}

export async function extendVocabulary(item: {
  label: string;
  type: string;
  hands: number;
  category: string;
  description: string;
  frame_count?: number;
}) {
  const res = await fetch(`${API_BASE}/vocabulary/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics`);
  return res.json();
}

export async function refineTranslation(
  signs: { word: string; confidence: number }[],
  customInstruction?: string
): Promise<RefinedTranslation> {
  const res = await fetch(`${API_BASE}/translation/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signs,
      custom_instruction: customInstruction,
    }),
  });
  return res.json();
}

export async function inspectGestureMultimodal(payload: {
  image_base64: string;
  predicted_label: string;
  confidence: number;
  hands_detected?: number;
  left_hand_present?: boolean;
  right_hand_present?: boolean;
  landmarks_summary?: any;
  custom_instruction?: string;
  user_consent_cloud?: boolean;
}): Promise<MultimodalInspectionResult> {
  const res = await fetch(`${API_BASE}/gemma/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchGemmaEvaluation(): Promise<GemmaEvaluationStats> {
  const res = await fetch(`${API_BASE}/gemma/evaluation`);
  return res.json();
}

export async function resolveDisagreement(payload: {
  event_id: string;
  action: 'confirm_classifier' | 'confirm_gemma' | 'correct';
  corrected_label?: string;
}) {
  const res = await fetch(`${API_BASE}/gemma/disagreement/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function compareModels(payload: {
  sample_signs?: string[];
  image_base64?: string;
  predicted_label?: string;
  confidence?: number;
}): Promise<{ benchmark_id: string; results: ModelBenchmarkResult[] }> {
  const res = await fetch(`${API_BASE}/gemma/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateGemmaSettings(payload: {
  provider?: string;
  primary_model?: string;
  fallback_model?: string;
  gemini_api_key?: string;
  gemini_model?: string;
  cloud_consent?: boolean;
}) {
  const res = await fetch(`${API_BASE}/gemma/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchDatasetSummary(): Promise<DatasetSummary> {
  const res = await fetch(`${API_BASE}/dataset/summary`);
  return res.json();
}

export async function recordDatasetSample(payload: {
  label: string;
  landmarks: any[];
  is_sequence?: boolean;
  metadata?: any;
}) {
  const res = await fetch(`${API_BASE}/dataset/sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function exportDatasetManifest() {
  const res = await fetch(`${API_BASE}/dataset/export`);
  return res.json();
}

export async function submitFeedback(
  predictedLabel: string,
  correctedLabel: string,
  confidence: number,
  landmarkData?: any
) {
  const res = await fetch(`${API_BASE}/translation/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      predicted_label: predictedLabel,
      corrected_label: correctedLabel,
      confidence,
      landmark_data: landmarkData,
    }),
  });
  return res.json();
}

export async function speakText(text: string, voice?: string, rate?: number) {
  const res = await fetch(`${API_BASE}/speech/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate }),
  });
  return res.json();
}

export async function stopSpeech() {
  const res = await fetch(`${API_BASE}/speech/stop`, { method: 'POST' });
  return res.json();
}

export async function fetchVoices(): Promise<{ name: string; locale: string }[]> {
  const res = await fetch(`${API_BASE}/speech/voices`);
  const data = await res.json();
  return data.voices || [];
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/history`);
  const data = await res.json();
  return data.history || [];
}

export async function deleteHistory(id: number) {
  const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
  return res.json();
}

// SignBridge 2.0 Multilingual Endpoints
export async function fetchLanguages() {
  const res = await fetch(`${API_BASE}/languages`);
  return res.json();
}

export async function fetchActiveLanguage() {
  const res = await fetch(`${API_BASE}/languages/active`);
  return res.json();
}

export async function selectLanguage(languageId: string) {
  const res = await fetch(`${API_BASE}/languages/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language_id: languageId }),
  });
  return res.json();
}

export async function fetchLanguageVocabulary(languageId: string) {
  const res = await fetch(`${API_BASE}/languages/${languageId}/vocabulary`);
  return res.json();
}

export async function fetchLanguageAlphabet(languageId: string) {
  const res = await fetch(`${API_BASE}/languages/${languageId}/alphabet`);
  return res.json();
}

export async function orchestrateTranslation(payload: {
  language: string;
  signs: { word: string; confidence: number }[];
  visual_frame_base64?: string | null;
  context_notes?: string;
}) {
  const res = await fetch(`${API_BASE}/translation/orchestrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function identifySign(payload: {
  language: string;
  label: string;
  confidence: number;
  detected_hands: any[];
  pose_landmarks?: any[];
  is_stable?: boolean;
}) {
  const res = await fetch(`${API_BASE}/translation/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchPlatformKpis() {
  const res = await fetch(`${API_BASE}/languages/analytics/kpis`);
  return res.json();
}

export async function fetchDictionaryAnalytics() {
  const res = await fetch(`${API_BASE}/languages/analytics/dictionary`);
  return res.json();
}

export async function fetchSignsByLanguage(languageId: string, category?: string) {
  const url = category
    ? `${API_BASE}/languages/${languageId}/signs?category=${encodeURIComponent(category)}`
    : `${API_BASE}/languages/${languageId}/signs`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchSignDetail(languageId: string, signId: number) {
  const res = await fetch(`${API_BASE}/languages/${languageId}/signs/${signId}`);
  return res.json();
}

export async function sendChatMessage(payload: {
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
  language_context?: string;
  current_sign_context?: string;
  allow_cloud?: boolean;
}) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}


