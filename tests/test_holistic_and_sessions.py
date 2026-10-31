"""Tests for Holistic landmark feature extraction, RecognitionStateMachine, and SessionManager isolation."""
import time
import numpy as np
import pytest

from ml.holistic_features import HolisticFeatureExtractor
from backend.services.recognition_state_machine import (
    RecognitionStateMachine,
    RecognitionStatus,
    GlossSegment,
)
from backend.services.session_manager import SessionManager


def test_holistic_extractor_hand_fallback():
    """Validates that HolisticFeatureExtractor works when face and pose landmarks are missing."""
    extractor = HolisticFeatureExtractor()
    dummy_hand = {
        "handedness": "Right",
        "landmarks": [{"x": 0.05 * i, "y": 0.05 * i, "z": 0.01 * i} for i in range(21)]
    }

    fused = extractor.fuse_features(detected_hands=[dummy_hand], pose_landmarks=None, face_landmarks=None)

    assert "canonical_hand_features" in fused
    assert fused["canonical_hand_features"].shape == (148,)
    assert fused["modality_mask"]["hands"] is True
    assert fused["modality_mask"]["face"] is False
    assert fused["modality_mask"]["pose"] is False
    assert fused["has_holistic_context"] is False


def test_recognition_state_machine_transitions():
    """Validates state machine transitions: DETECTING -> PREDICTING -> VERIFIED / UNKNOWN."""
    sm = RecognitionStateMachine(confidence_threshold=0.65, stability_count=3)

    # 1. No hands -> DETECTING
    res1 = sm.update_frame(predicted_label="NONE", confidence=0.0, is_hands_present=False)
    assert res1["state"] == RecognitionStatus.DETECTING.value

    # 2. Low confidence -> UNKNOWN
    res2 = sm.update_frame(predicted_label="HELLO", confidence=0.45, is_hands_present=True)
    assert res2["state"] == RecognitionStatus.UNKNOWN.value

    # 3. High confidence streak accumulating -> PREDICTING
    res3 = sm.update_frame(predicted_label="HELLO", confidence=0.88, is_hands_present=True)
    assert res3["state"] == RecognitionStatus.PREDICTING.value
    assert res3["is_stable"] is False

    res4 = sm.update_frame(predicted_label="HELLO", confidence=0.90, is_hands_present=True)
    assert res4["is_stable"] is False

    # 4. Third consecutive -> Stability threshold reached -> VERIFIED
    res5 = sm.update_frame(predicted_label="HELLO", confidence=0.91, is_hands_present=True)
    assert res5["is_stable"] is True
    assert res5["new_segment_emitted"] is not None
    assert res5["new_segment_emitted"]["gloss"] == "HELLO"
    assert res5["new_segment_emitted"]["status"] == RecognitionStatus.VERIFIED.value


def test_session_manager_isolation():
    """Validates that Language selection and buffers are isolated across different user sessions."""
    manager = SessionManager()

    sess_a = manager.get_or_create_session("user_alpha", language="ISL")
    sess_b = manager.get_or_create_session("user_beta", language="BSL")

    assert sess_a.language == "ISL"
    assert sess_b.language == "BSL"

    # Changing user alpha's language does not mutate user beta's language
    sess_a.set_language("ASL")
    assert sess_a.language == "ASL"
    assert sess_b.language == "BSL"

    # Distinct predictor instances
    assert sess_a.predictor is not sess_b.predictor
    assert sess_a.state_machine is not sess_b.state_machine

    # Cleanup
    manager.remove_session("user_alpha")
    assert manager.get_session("user_alpha") is None
    assert manager.get_session("user_beta") is not None
