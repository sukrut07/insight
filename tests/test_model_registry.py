"""Tests for SignLanguageRecognizer interface and ModelRegistry."""
import pytest
from ml.recognizer_interface import SignLanguageRecognizer
from ml.model_registry import model_registry
from ml.isl.recognizer import ISLRecognizer
from ml.bsl.recognizer import BSLRecognizer
from ml.asl.recognizer import ASLRecognizer


def test_registry_contains_supported_languages():
    """Validates that ISL, BSL, and ASL recognizers are registered."""
    models = model_registry.list_models()
    languages = {m["language"] for m in models}
    assert "ISL" in languages
    assert "BSL" in languages
    assert "ASL" in languages


def test_isl_recognizer_contract():
    """Validates ISLRecognizer adheres to SignLanguageRecognizer ABC."""
    rec = model_registry.get_recognizer("ISL")
    assert isinstance(rec, SignLanguageRecognizer)
    assert isinstance(rec, ISLRecognizer)

    meta = rec.get_model_metadata()
    assert meta["status"] == "active"
    assert meta["input_dimension"] == 148
    assert "Abs6187/isl-models (Hierarchical Two-Stream Transformer)" in meta["candidate_evaluations"][0]

    vocab = rec.get_vocabulary()
    assert len(vocab) > 0
    assert any(s["label"] == "HELLO" for s in vocab)

    # Test dummy frame inference
    dummy_hand = {
        "handedness": "Right",
        "landmarks": [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    }
    pred = rec.predict_frame([dummy_hand])
    assert "label" in pred
    assert "confidence" in pred
    assert pred["language"] == "ISL"


def test_bsl_recognizer_contract():
    """Validates BSLRecognizer adheres to SignLanguageRecognizer ABC and reports experimental state."""
    rec = model_registry.get_recognizer("BSL")
    assert isinstance(rec, SignLanguageRecognizer)
    assert isinstance(rec, BSLRecognizer)

    meta = rec.get_model_metadata()
    assert meta["status"] == "experimental"
    assert "PoseFormer" in meta["primary_architecture"]

    pred = rec.predict_frame([])
    assert pred["status"] == "model_pending"
    assert pred["language"] == "BSL"


def test_asl_recognizer_contract():
    """Validates ASLRecognizer adheres to SignLanguageRecognizer ABC and reports experimental state."""
    rec = model_registry.get_recognizer("ASL")
    assert isinstance(rec, SignLanguageRecognizer)
    assert isinstance(rec, ASLRecognizer)

    meta = rec.get_model_metadata()
    assert meta["status"] == "experimental"
    assert "BiGRU" in meta["primary_architecture"]

    pred = rec.predict_frame([])
    assert pred["status"] == "model_pending"
    assert pred["language"] == "ASL"


def test_registry_unsupported_language_raises():
    """Validates that querying an unsupported language raises KeyError."""
    with pytest.raises(KeyError, match="Unsupported sign language"):
        model_registry.get_recognizer("FSL")
