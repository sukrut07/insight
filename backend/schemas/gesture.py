"""Pydantic schemas for gesture recognition and hand landmark data."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LandmarkCoordinate(BaseModel):
    x: float
    y: float
    z: float


class HandLandmarks(BaseModel):
    handedness: str = Field(default="Right", description="Left or Right hand")
    landmarks: List[LandmarkCoordinate] = Field(..., min_length=21, max_length=21)


class GesturePredictionRequest(BaseModel):
    hands: List[HandLandmarks]


class GesturePredictionResponse(BaseModel):
    label: str
    confidence: float
    is_stable: bool
    new_word_emitted: Optional[str] = None
    hands_detected: int
    left_hand: bool
    right_hand: bool
    inference_time_ms: float


class VocabularyItem(BaseModel):
    id: int
    label: str
    type: str
    hands: int
    category: str
    description: str


class VocabularyResponse(BaseModel):
    total: int
    vocabulary: List[VocabularyItem]
