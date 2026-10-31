"""Pydantic schemas for Gemma 4 multimodal inspection, explanation, and evaluation."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MultimodalInspectRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded webcam image frame or cropped hand region")
    predicted_label: str = Field(..., description="Label predicted by the ML gesture classifier")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Classifier confidence score")
    hands_detected: int = Field(default=1, ge=0, le=2)
    left_hand_present: bool = False
    right_hand_present: bool = True
    landmarks_summary: Optional[Dict[str, Any]] = None
    custom_instruction: Optional[str] = None
    user_consent_cloud: bool = Field(default=False, description="Explicit consent if sending to hosted API")


class MultimodalInspectResponse(BaseModel):
    is_consistent: bool = Field(..., description="True if visual observations match classifier prediction")
    confidence_assessment: str = Field(..., description="'high' | 'moderate' | 'low' | 'uncertain'")
    visual_observations: str = Field(..., description="Gemma's natural language description of observed hand shape and posture")
    discrepancy_detected: bool = Field(..., description="True if visual evidence contradicts classifier prediction")
    discrepancy_details: Optional[str] = None
    suggested_alternatives: List[str] = Field(default_factory=list, description="Verified ISL labels consistent with visual evidence")
    explanation: str = Field(..., description="Step-by-step reasoning explaining the visual-classifier comparison")
    flag_for_review: bool = Field(..., description="True if prediction should be held for human confirmation")
    model_used: str
    provider_used: str = "local_ollama"
    execution_time_ms: float
    multimodal_mode: str = "vision"  # "vision" or "landmark_fallback"
    raw_response: Optional[str] = None


class DisagreementEvent(BaseModel):
    id: str
    timestamp: float
    predicted_label: str
    classifier_confidence: float
    gemma_observation: str
    gemma_consistent: bool
    status: str = "pending_review"  # "pending_review", "confirmed_classifier", "confirmed_gemma", "custom_corrected"
    resolved_label: Optional[str] = None


class DisagreementActionRequest(BaseModel):
    event_id: str
    action: str = Field(..., description="'confirm_classifier' | 'confirm_gemma' | 'correct'")
    corrected_label: Optional[str] = None


class ModelCompareRequest(BaseModel):
    sample_text: Optional[str] = None
    sample_signs: Optional[List[str]] = None
    image_base64: Optional[str] = None
    predicted_label: Optional[str] = "HELLO"
    confidence: Optional[float] = 0.88


class ModelBenchmarkResult(BaseModel):
    model_name: str
    provider: str
    latency_ms: float
    status: str
    output_preview: str
    structured_valid: bool
    notes: str


class ModelCompareResponse(BaseModel):
    benchmark_id: str
    results: List[ModelBenchmarkResult]


class GemmaSettingsUpdate(BaseModel):
    provider: Optional[str] = None  # "local_ollama" or "gemini_api"
    primary_model: Optional[str] = None
    fallback_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    cloud_consent: Optional[bool] = None


class GemmaEvaluationStats(BaseModel):
    active_provider: str
    active_primary_model: str
    active_fallback_model: str
    multimodal_supported: bool
    multimodal_mode: str
    total_inspections: int
    disagreements_count: int
    disagreement_rate: float
    average_latency_ms: float
    recent_disagreements: List[DisagreementEvent]


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' | 'assistant' | 'system'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query about sign language, dictionary, or practice")
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    language_context: Optional[str] = "ISL"
    current_sign_context: Optional[str] = None
    allow_cloud: bool = True


class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str
    latency_ms: float
    error: Optional[str] = None

