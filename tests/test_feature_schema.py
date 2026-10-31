"""Tests for canonical 148-dimensional feature schema and strict validation."""
import numpy as np
import pytest

from ml.feature_engineering import (
    FEATURE_SCHEMA,
    TOTAL_FEATURES,
    FEATURE_SCHEMA_VERSION,
    validate_feature_vector,
    extract_features,
    TemporalFeatureBuffer,
)


def test_canonical_schema_dimensions():
    """Validates that the canonical feature schema sums strictly to 148 dimensions."""
    assert sum(FEATURE_SCHEMA.values()) == 148
    assert TOTAL_FEATURES == 148
    assert FEATURE_SCHEMA_VERSION == "1.0.0"
    assert FEATURE_SCHEMA["left_hand_coords"] == 63
    assert FEATURE_SCHEMA["right_hand_coords"] == 63
    assert FEATURE_SCHEMA["left_angles"] == 10
    assert FEATURE_SCHEMA["right_angles"] == 10
    assert FEATURE_SCHEMA["left_present"] == 1
    assert FEATURE_SCHEMA["right_present"] == 1


def test_validate_feature_vector_accepts_valid():
    """Validates that valid 148-dimensional array passes validation without exception."""
    valid_arr = np.zeros((148,), dtype=np.float32)
    # Should not raise
    validate_feature_vector(valid_arr, TOTAL_FEATURES)


def test_validate_feature_vector_rejects_mismatch():
    """Validates that mismatched dimensions (e.g. old 126 or arbitrary sizes) are rejected."""
    mismatched_126 = np.zeros((126,), dtype=np.float32)
    with pytest.raises(ValueError, match="Feature dimension mismatch"):
        validate_feature_vector(mismatched_126, TOTAL_FEATURES)

    mismatched_150 = np.zeros((150,), dtype=np.float32)
    with pytest.raises(ValueError, match="Feature dimension mismatch"):
        validate_feature_vector(mismatched_150, TOTAL_FEATURES)


def test_extract_features_interface():
    """Tests the standardized extract_features function."""
    dummy_hand = {
        "handedness": "Right",
        "landmarks": [{"x": 0.1 * i, "y": 0.2 * i, "z": 0.05 * i} for i in range(21)]
    }
    features, schema_ver, validity_mask, meta = extract_features([dummy_hand])

    assert isinstance(features, np.ndarray)
    assert features.shape == (148,)
    assert schema_ver == "1.0.0"
    assert validity_mask["right_hand_valid"] is True
    assert validity_mask["left_hand_valid"] is False
    assert validity_mask["is_complete"] is True
    assert meta["hand_count"] == 1


def test_temporal_feature_buffer_shape():
    """Tests that TemporalFeatureBuffer always yields (30, 148) sequences."""
    buffer = TemporalFeatureBuffer(window_size=30, feature_dim=148)
    dummy_hand = {
        "handedness": "Right",
        "landmarks": [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    }

    # Empty buffer returns zeros
    seq = buffer.get_sequence()
    assert seq.shape == (30, 148)

    # Adding frames maintains shape
    for _ in range(5):
        buffer.add_frame([dummy_hand])

    seq_partial = buffer.get_sequence()
    assert seq_partial.shape == (30, 148)
