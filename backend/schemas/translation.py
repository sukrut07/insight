"""Pydantic schemas for translation refinement, user feedback, and TTS."""
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class RecognizedSignItem(BaseModel):
    word: str
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class TranslationRefineRequest(BaseModel):
    signs: List[RecognizedSignItem]
    custom_instruction: Optional[str] = None


class TranslationRefineResponse(BaseModel):
    refined_sentence: str
    original_tokens: List[str]
    alternatives: List[str] = []
    notes: Optional[str] = None
    model_used: str
    execution_time_ms: float
    is_fallback: bool


class FeedbackSubmitRequest(BaseModel):
    predicted_label: str
    corrected_label: str
    confidence: float = 1.0
    landmark_data: Optional[Any] = None


class FeedbackSubmitResponse(BaseModel):
    status: str
    feedback_id: int
    message: str


class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    rate: Optional[int] = None


class SpeakResponse(BaseModel):
    status: str
    text: str
    voice: str
