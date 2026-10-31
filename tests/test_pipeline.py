"""Comprehensive automated test suite for SignBridge.

Validates normalization, model inference, Gemma fallback, database, and API endpoints.
"""
import pytest
import numpy as np
from httpx import AsyncClient, ASGITransport

from ml.normalize import normalize_hand_landmarks, compute_finger_joint_angles, process_dual_hand_landmarks
from ml.models.static_classifier import StaticGestureClassifier
from ml.models.lstm_classifier import TemporalGestureClassifier
from ml.predict import GesturePredictor
from backend.main import app
from backend.services.gemma_service import GemmaService
from backend.services.feedback_service import feedback_service
from backend.database.connection import init_db
from backend.database.models import add_translation_history, get_all_translation_history


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


def test_landmark_normalization():
    # 21 points
    landmarks = np.random.uniform(0.1, 0.9, size=(21, 3)).astype(np.float32)
    norm, scale = normalize_hand_landmarks(landmarks)

    assert norm.shape == (21, 3)
    assert scale > 0.0
    # Wrist (index 0) must be translated to (0, 0, 0)
    assert np.allclose(norm[0], [0.0, 0.0, 0.0], atol=1e-5)


def test_finger_joint_angles():
    # Straight open hand vs curled
    landmarks = np.zeros((21, 3), dtype=np.float32)
    for i in range(21):
        landmarks[i, 1] = float(i) * 0.05  # Linear points

    angles = compute_finger_joint_angles(landmarks)
    assert angles.shape == (10,)
    assert np.all(angles >= 0.0)
    assert np.all(angles <= np.pi)


def test_missing_hand_handling():
    # Only single Right hand present
    detected_hands = [{
        "handedness": "Right",
        "landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)]
    }]

    raw_126, eng_148, metadata = process_dual_hand_landmarks(detected_hands)
    assert raw_126.shape == (126,)
    assert eng_148.shape == (148,)
    assert metadata["hand_count"] == 1
    assert metadata["left_detected"] is False
    assert metadata["right_detected"] is True

    # Left hand portion (first 63 values) should be zero
    assert np.all(raw_126[:63] == 0.0)


def test_static_classifier_inference():
    clf = StaticGestureClassifier(model_type="rf", num_classes=15)
    # Mock data
    X = np.random.randn(30, 148).astype(np.float32)
    y = np.array([i % 15 for i in range(30)], dtype=np.int64)
    clf.fit(X, y)

    pred, conf = clf.predict(X[0])
    assert 0 <= pred < 15
    assert 0.0 <= conf <= 1.0


def test_temporal_classifier_inference():
    clf = TemporalGestureClassifier(input_dim=148, hidden_dim=32, num_layers=1, num_classes=15)
    X = np.random.randn(10, 30, 148).astype(np.float32)
    y = np.array([i % 15 for i in range(10)], dtype=np.int64)
    clf.fit(X, y, epochs=1, batch_size=5)

    pred, conf = clf.predict(X[0])
    assert 0 <= pred < 15
    assert 0.0 <= conf <= 1.0


def test_gesture_predictor_smoothing():
    predictor = GesturePredictor(confidence_threshold=0.1, smoothing_window=5, stability_count=3)
    dummy_hand = [{
        "handedness": "Right",
        "landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)]
    }]

    # Run multiple frames to test stability
    res = None
    for _ in range(5):
        res = predictor.process_frame(dummy_hand)

    assert res is not None
    assert "label" in res
    assert "confidence" in res
    assert "is_stable" in res


@pytest.mark.asyncio
async def test_gemma_fallback_mechanism():
    service = GemmaService()
    # Force invalid Ollama URL to verify graceful fallback
    service.base_url = "http://localhost:99999"

    signs = [
        {"word": "I", "confidence": 0.95},
        {"word": "HELP", "confidence": 0.90}
    ]
    result = await service.refine_translation(signs)
    assert result["is_fallback"] is True
    assert result["refined_sentence"].lower() == "i help."
    assert result["model_used"] == "offline_passthrough"


def test_database_and_feedback():
    h_id = add_translation_history(["HELLO", "WORLD"], "Hello world.", "test_model")
    assert h_id > 0

    history = get_all_translation_history(limit=5)
    assert len(history) >= 1
    assert history[0]["refined_sentence"] == "Hello world."

    f_id = feedback_service.record_correction(
        predicted_label="HELLO",
        corrected_label="HELP",
        confidence=0.85,
        landmark_data=[0.1, 0.2, 0.3]
    )
    assert f_id > 0


@pytest.mark.asyncio
async def test_api_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "device" in data


@pytest.mark.asyncio
async def test_api_vocabulary_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/vocabulary")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 15
        assert len(data["vocabulary"]) >= 15


@pytest.mark.asyncio
async def test_gemma_multimodal_inspection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test consistent gesture
        res = await client.post(
            "/api/gemma/inspect",
            json={
                "image_base64": "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                "predicted_label": "HELLO",
                "confidence": 0.92,
                "hands_detected": 1,
                "left_hand_present": False,
                "right_hand_present": True
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert "is_consistent" in data
        assert "confidence_assessment" in data
        assert "visual_observations" in data
        assert "explanation" in data
        assert data["is_consistent"] is True

        # Test discrepancy case: HELP requires 2 hands, but only 1 detected
        res_disc = await client.post(
            "/api/gemma/inspect",
            json={
                "image_base64": "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                "predicted_label": "HELP",
                "confidence": 0.85,
                "hands_detected": 1,
                "left_hand_present": False,
                "right_hand_present": True
            }
        )
        assert res_disc.status_code == 200
        disc_data = res_disc.json()
        assert disc_data["discrepancy_detected"] is True
        assert disc_data["flag_for_review"] is True


@pytest.mark.asyncio
async def test_gemma_evaluation_and_disagreement_resolution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        eval_res = await client.get("/api/gemma/evaluation")
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert "active_provider" in eval_data
        assert "disagreements_count" in eval_data
        assert eval_data["total_inspections"] > 0

        # If any disagreement was logged, test resolving it
        if eval_data["recent_disagreements"]:
            ev_id = eval_data["recent_disagreements"][0]["id"]
            action_res = await client.post(
                "/api/gemma/disagreement/action",
                json={
                    "event_id": ev_id,
                    "action": "correct",
                    "corrected_label": "HELLO"
                }
            )
            assert action_res.status_code == 200
            assert action_res.json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_vocabulary_plugin_extension():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register a custom sign plugin
        res = await client.post(
            "/api/vocabulary/extend",
            json={
                "label": "CUSTOM_WELCOME_TEST",
                "type": "dynamic",
                "hands": 2,
                "category": "social",
                "description": "Two open palms held outward welcoming guests."
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["success", "error"]  # success first time or error if duplicate

        # Verify it appears in get_vocabulary
        vocab_res = await client.get("/api/vocabulary")
        assert vocab_res.status_code == 200
        all_labels = [s["label"] for s in vocab_res.json()["signs"]]
        assert "CUSTOM_WELCOME_TEST" in all_labels


@pytest.mark.asyncio
async def test_dataset_summary_and_recording():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Record a test sample
        rec_res = await client.post(
            "/api/dataset/sample",
            json={
                "label": "HELLO",
                "landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)],
                "is_sequence": False
            }
        )
        assert rec_res.status_code == 200
        assert rec_res.json()["status"] == "saved"

        # Check summary
        summary_res = await client.get("/api/dataset/summary")
        assert summary_res.status_code == 200
        sum_data = summary_res.json()
        assert "total_samples" in sum_data
        assert "classes" in sum_data
