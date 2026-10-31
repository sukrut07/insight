"""Recognition State Machine and Structured Gloss Sequence Representation.

Implements explicit decision states, boundary detection, uncertainty handling,
and non-manual grammatical marker tracking for sign language processing.
"""
from enum import Enum
import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RecognitionStatus(str, Enum):
    UNKNOWN = "unknown"
    DETECTING = "detecting"
    PREDICTING = "predicting"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    DISPUTED = "disputed"
    USER_CONFIRMED = "user_confirmed"
    REJECTED = "rejected"


class GlossSegment(BaseModel):
    """Linguistically grounded sign segment representation."""
    gloss: str
    start_time: float
    end_time: float
    confidence: float
    status: RecognitionStatus = RecognitionStatus.DETECTING
    non_manual_markers: List[str] = Field(default_factory=list)
    source_modality: str = "hands"
    user_confirmed: bool = False
    verification_details: Optional[Dict[str, Any]] = None


class StructuredSentenceRepresentation(BaseModel):
    """Intermediate representation fed into language translation."""
    language: str = "ISL"
    segments: List[GlossSegment] = Field(default_factory=list)
    non_manual_markers: List[str] = Field(default_factory=list)
    sentence_boundary: bool = False
    overall_confidence: float = 0.0


class RecognitionStateMachine:
    """Manages temporal state transitions, stability hysteresis, and confidence gating.

    Rules:
    - Never forces low-confidence or OOD gestures into known classes.
    - Gemma does not override classifier unilaterally; disputes are flagged.
    - Detects sign boundaries when resting posture occurs.
    """

    def __init__(
        self,
        confidence_threshold: float = 0.65,
        stability_count: int = 3,
        boundary_silence_seconds: float = 1.0,
    ):
        self.confidence_threshold = confidence_threshold
        self.stability_count = stability_count
        self.boundary_silence_seconds = boundary_silence_seconds

        self.current_state: RecognitionStatus = RecognitionStatus.DETECTING
        self.current_candidate: Optional[str] = None
        self.candidate_confidence: float = 0.0
        self.candidate_streak: int = 0
        self.candidate_start_time: float = time.time()
        self.last_sign_time: float = time.time()

        self.gloss_history: List[GlossSegment] = []
        self.active_non_manual_markers: List[str] = []

    def update_frame(
        self,
        predicted_label: str,
        confidence: float,
        is_hands_present: bool,
        non_manual_markers: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Updates state machine with incoming frame prediction.

        Returns status dict for the current frame.
        """
        now = time.time()
        self.active_non_manual_markers = non_manual_markers or []
        label_upper = predicted_label.strip().upper()

        # Check for empty / resting state
        if not is_hands_present or label_upper in ["NONE", "REST"]:
            self.candidate_streak = 0
            time_since_last_sign = now - self.last_sign_time
            sentence_boundary = bool(self.gloss_history and time_since_last_sign >= self.boundary_silence_seconds)
            self.current_state = RecognitionStatus.DETECTING
            self.current_candidate = None

            return {
                "state": self.current_state.value,
                "candidate": None,
                "confidence": 0.0,
                "is_stable": False,
                "new_segment_emitted": None,
                "sentence_boundary": sentence_boundary,
                "non_manual_markers": self.active_non_manual_markers,
            }

        # Check for Out-of-Distribution / Low Confidence
        if confidence < self.confidence_threshold:
            self.current_state = RecognitionStatus.UNKNOWN
            self.candidate_streak = 0
            self.current_candidate = "UNKNOWN"

            return {
                "state": self.current_state.value,
                "candidate": "UNKNOWN",
                "confidence": round(confidence, 3),
                "is_stable": False,
                "new_segment_emitted": None,
                "sentence_boundary": False,
                "non_manual_markers": self.active_non_manual_markers,
            }

        # Valid candidate tracking with streak accumulation
        if label_upper == self.current_candidate:
            self.candidate_streak += 1
        else:
            self.current_candidate = label_upper
            self.candidate_confidence = confidence
            self.candidate_streak = 1
            self.candidate_start_time = now
            self.current_state = RecognitionStatus.PREDICTING

        # Moving average confidence
        self.candidate_confidence = 0.7 * self.candidate_confidence + 0.3 * confidence

        new_segment: Optional[GlossSegment] = None
        is_stable = self.candidate_streak >= self.stability_count

        if is_stable:
            # Emit verified or pending verification segment if not already emitted
            if not self.gloss_history or self.gloss_history[-1].gloss != self.current_candidate or (now - self.gloss_history[-1].end_time > 1.2):
                self.current_state = RecognitionStatus.VERIFIED
                new_segment = GlossSegment(
                    gloss=self.current_candidate,
                    start_time=self.candidate_start_time,
                    end_time=now,
                    confidence=round(self.candidate_confidence, 3),
                    status=self.current_state,
                    non_manual_markers=list(self.active_non_manual_markers),
                    source_modality="hands+pose" if self.active_non_manual_markers else "hands",
                    user_confirmed=False
                )
                self.gloss_history.append(new_segment)
                self.last_sign_time = now

        return {
            "state": self.current_state.value,
            "candidate": self.current_candidate,
            "confidence": round(self.candidate_confidence, 3),
            "is_stable": is_stable,
            "new_segment_emitted": new_segment.dict() if new_segment else None,
            "sentence_boundary": False,
            "non_manual_markers": self.active_non_manual_markers,
        }

    def dispute_segment(self, index: int, reason: str):
        """Flags a segment as DISPUTED when classifier and verification engine disagree."""
        if 0 <= index < len(self.gloss_history):
            self.gloss_history[index].status = RecognitionStatus.DISPUTED
            self.gloss_history[index].verification_details = {"dispute_reason": reason}

    def confirm_segment(self, index: int):
        """User confirms an ambiguous or disputed segment."""
        if 0 <= index < len(self.gloss_history):
            self.gloss_history[index].status = RecognitionStatus.USER_CONFIRMED
            self.gloss_history[index].user_confirmed = True

    def reject_segment(self, index: int):
        """User rejects an incorrect segment."""
        if 0 <= index < len(self.gloss_history):
            self.gloss_history[index].status = RecognitionStatus.REJECTED

    def get_structured_sentence(self, language: str = "ISL") -> StructuredSentenceRepresentation:
        """Returns structured gloss sequence with boundary status."""
        active_segments = [s for s in self.gloss_history if s.status != RecognitionStatus.REJECTED]
        overall_conf = (
            sum(s.confidence for s in active_segments) / len(active_segments)
            if active_segments else 0.0
        )
        return StructuredSentenceRepresentation(
            language=language,
            segments=active_segments,
            non_manual_markers=list(self.active_non_manual_markers),
            sentence_boundary=bool(time.time() - self.last_sign_time >= self.boundary_silence_seconds),
            overall_confidence=round(overall_conf, 3),
        )

    def reset(self):
        """Resets the state machine and clears history."""
        self.current_state = RecognitionStatus.DETECTING
        self.current_candidate = None
        self.candidate_confidence = 0.0
        self.candidate_streak = 0
        self.gloss_history.clear()
        self.active_non_manual_markers.clear()
        self.last_sign_time = time.time()
