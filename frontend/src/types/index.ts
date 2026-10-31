export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface DetectedHand {
  handedness: 'Left' | 'Right';
  landmarks: LandmarkPoint[];
}

export interface RecognitionMessage {
  type: 'recognition_result';
  session_id?: string;
  language?: string;
  status?: string;
  state?: string;
  hands_detected: number;
  left_hand: boolean;
  right_hand: boolean;
  label: string;
  raw_label: string;
  confidence: number;
  is_stable: boolean;
  new_word_emitted: string | null;
  sentence_boundary?: boolean;
  non_manual_markers?: string[];
  landmarks: DetectedHand[];
  annotated_frame: string;
  fps: number;
  latency_ms: number;
}

export interface VocabularyItem {
  id: number;
  label: string;
  type: 'static' | 'dynamic';
  hands: number;
  category: string;
  description: string;
  frame_count?: number;
  is_plugin?: boolean;
}

export interface ModelStatus {
  mediapipe_ready: boolean;
  static_model_loaded: boolean;
  temporal_model_loaded: boolean;
  ollama_available: boolean;
  primary_model_available: boolean;
  fallback_model_available: boolean;
  primary_model_name: string;
  fallback_model_name: string;
  installed_ollama_models: string[];
  mps_gpu_acceleration: boolean;
  active_provider?: string;
  active_model?: string;
  multimodal_supported?: boolean;
  cloud_consent?: boolean;
  gemini_api_configured?: boolean;
}

export interface RefinedTranslation {
  refined_sentence: string;
  original_tokens: string[];
  alternatives: string[];
  notes?: string;
  model_used: string;
  execution_time_ms: number;
  is_fallback: boolean;
}

export interface HistoryItem {
  id: number;
  raw_tokens: string[];
  refined_sentence: string;
  model_used: string;
  created_at: string;
}

export interface MultimodalInspectionResult {
  is_consistent: boolean;
  confidence_assessment: 'high' | 'moderate' | 'low' | 'uncertain';
  visual_observations: string;
  discrepancy_detected: boolean;
  discrepancy_details?: string | null;
  suggested_alternatives: string[];
  explanation: string;
  flag_for_review: boolean;
  model_used: string;
  provider_used: string;
  execution_time_ms: number;
  multimodal_mode: string;
  raw_response?: string | null;
}

export interface DisagreementEvent {
  id: string;
  timestamp: number;
  predicted_label: string;
  classifier_confidence: number;
  gemma_observation: string;
  gemma_consistent: boolean;
  status: string;
  resolved_label?: string | null;
}

export interface GemmaEvaluationStats {
  active_provider: string;
  active_primary_model: string;
  active_fallback_model: string;
  multimodal_supported: boolean;
  multimodal_mode: string;
  total_inspections: number;
  disagreements_count: number;
  disagreement_rate: number;
  average_latency_ms: number;
  recent_disagreements: DisagreementEvent[];
}

export interface ModelBenchmarkResult {
  model_name: string;
  provider: string;
  latency_ms: number;
  status: string;
  output_preview: string;
  structured_valid: boolean;
  notes: string;
}

export interface DatasetClassInfo {
  label: string;
  sample_count: number;
  is_sequence: boolean;
}

export interface DatasetSummary {
  total_samples: number;
  total_classes: number;
  classes: DatasetClassInfo[];
  storage_path: string;
  is_ready_for_training: boolean;
}

export interface AnalyticsData {
  metrics: {
    evaluated_at?: number;
    total_classes?: number;
    classes?: string[];
    static_model?: {
      model_type: string;
      test_samples: number;
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      inference_latency_ms: number;
      confusion_matrix: number[][];
    };
    temporal_model?: {
      model_type: string;
      test_samples: number;
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      inference_latency_ms: number;
      confusion_matrix: number[][];
    };
  };
  feedback: {
    total_feedback_entries: number;
    saved_feedback_landmark_files: number;
  };
  is_model_trained: boolean;
}

export type SignLanguageId = 'ISL' | 'BSL' | 'ASL';

export interface LanguageMetadata {
  language_id: SignLanguageId;
  name: string;
  native_name: string;
  family: string;
  status: 'active' | 'experimental' | 'unavailable';
  model_version: string;
  fingerspelling_type: string;
  vocabulary_count: number;
  alphabet_count: number;
}

export interface AlphabetItem {
  letter: string;
  hands: number;
  description: string;
  orientation: string;
}

export interface SignReferenceItem {
  id: number;
  label: string;
  type: 'static' | 'dynamic';
  hands: number;
  category: string;
  description: string;
  frame_count?: number;
  hand_orientation?: string;
  start_position?: string;
  end_position?: string;
}

export interface VisualIdentificationResult {
  language: SignLanguageId;
  predicted_sign: string;
  confidence: number;
  sign_reference_id?: number | null;
  recognition_type: string;
  tracking_status: 'tracked' | 'occluded' | 'in_motion' | 'lost';
  hands_detected: number;
  expected_hands: number;
  is_stable: boolean;
  uncertainty_information: {
    is_ambiguous: boolean;
    requires_confirmation: boolean;
    plausible_alternatives: { label: string; description: string; category: string }[];
  };
  reference_card_data: {
    label: string;
    category: string;
    description: string;
    hand_orientation: string;
    start_position: string;
    end_position: string;
    hands_required: number;
  };
}

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  fontSizeScale: number; // 1.0, 1.15, 1.3
  speechOutput: boolean;
  speechRate: number;
  reducedMotion: boolean;
  visualAlerts: boolean;
  showLandmarksOverlay: boolean;
}

export type ActiveTab =
  | 'home'
  | 'gesture-lab'
  | 'connect'
  | 'learn'
  | 'dictionary'
  | 'research'
  | 'about'
  | 'settings'
  // Backward-compatible aliases
  | 'landing'
  | 'translator'
  | 'gemma'
  | 'status'
  | 'analytics'
  | 'editor'
  | 'collection';

