"""Comprehensive test suite for SignBridge 2.0 Multilingual Intelligence Engine."""
import pytest
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.services.language_router import language_router
from backend.services.gemma_orchestrator import gemma_orchestrator
from backend.services.sign_identification import sign_identification_service
from backend.services.translation_orchestrator import translation_orchestrator


def test_language_router_initialization():
    """Verifies that ISL, BSL, and ASL are configured and loaded."""
    supported = language_router.get_supported_languages()
    assert len(supported) == 3
    lang_ids = [l["language_id"] for l in supported]
    assert "ISL" in lang_ids
    assert "BSL" in lang_ids
    assert "ASL" in lang_ids

    # ISL should be active with trained model
    isl_meta = next(l for l in supported if l["language_id"] == "ISL")
    assert isl_meta["status"] == "active"
    assert isl_meta["vocabulary_count"] > 0

    # BSL & ASL should be distinct configurations
    bsl_meta = next(l for l in supported if l["language_id"] == "BSL")
    assert bsl_meta["status"] == "experimental"

    asl_meta = next(l for l in supported if l["language_id"] == "ASL")
    assert asl_meta["status"] == "experimental"


def test_explicit_language_selection():
    """Verifies explicit switching and rejection of invalid languages."""
    assert language_router.set_active_language("BSL") is True
    assert language_router.get_active_language() == "BSL"

    assert language_router.set_active_language("ASL") is True
    assert language_router.get_active_language() == "ASL"

    # Reject unsupported language
    assert language_router.set_active_language("XYZ") is False
    assert language_router.get_active_language() == "ASL"

    # Reset to ISL
    language_router.set_active_language("ISL")
    assert language_router.get_active_language() == "ISL"


def test_no_silent_substitution():
    """Verifies that an uncalibrated language returns model_pending rather than hallucinating."""
    language_router.set_active_language("BSL")
    res = language_router.format_prediction_result(label="HELLO", confidence=0.95)
    assert res["language"] == "BSL"
    assert res["status"] == "model_pending"
    assert "experimental" in res.get("message", "").lower()

    # Reset to ISL
    language_router.set_active_language("ISL")
    res_isl = language_router.format_prediction_result(label="HELLO", confidence=0.92)
    assert res_isl["language"] == "ISL"
    assert res_isl["status"] == "recognized"


def test_sign_identification_matching():
    """Verifies sign reference card matching and uncertainty tracking."""
    # Test valid ISL sign HELP (2 hands required)
    result = sign_identification_service.identify_sign(
        language="ISL",
        predicted_label="HELP",
        confidence=0.94,
        detected_hands=[{"handedness": "Left"}, {"handedness": "Right"}],
        is_stable=True
    )
    assert result["predicted_sign"] == "HELP"
    assert result["expected_hands"] == 2
    assert result["hands_detected"] == 2
    assert result["tracking_status"] == "tracked"
    assert result["uncertainty_information"]["is_ambiguous"] is False

    # Test occluded sign (HELP with only 1 hand visible)
    occluded_result = sign_identification_service.identify_sign(
        language="ISL",
        predicted_label="HELP",
        confidence=0.94,
        detected_hands=[{"handedness": "Right"}],
        is_stable=True
    )
    assert occluded_result["tracking_status"] == "occluded"
    assert occluded_result["uncertainty_information"]["is_ambiguous"] is True


@pytest.mark.asyncio
async def test_gemma_orchestrator_deterministic_fallback():
    """Verifies that translation produces clean English even if Ollama is unreachable."""
    result = await gemma_orchestrator.orchestrate_translation(
        language="ISL",
        recognized_signs=[
            {"label": "HELLO", "confidence": 0.95},
            {"label": "HELP", "confidence": 0.92}
        ]
    )
    assert result["language"] == "ISL"
    assert len(result["recognized_sequence"]) == 2
    assert len(result["readable_translation"]) > 0


@pytest.mark.asyncio
async def test_api_languages_endpoints():
    """Integration test for /api/languages endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/languages
        resp = await client.get("/api/languages")
        assert resp.status_code == 200
        langs = resp.json()
        assert len(langs) == 3

        # POST /api/languages/select
        resp_select = await client.post("/api/languages/select", json={"language_id": "ASL"})
        assert resp_select.status_code == 200
        assert resp_select.json()["active_language"] == "ASL"

        # GET /api/languages/ASL/vocabulary
        resp_vocab = await client.get("/api/languages/ASL/vocabulary")
        assert resp_vocab.status_code == 200
        assert "vocabulary" in resp_vocab.json()

        # GET /api/languages/BSL/alphabet
        resp_alpha = await client.get("/api/languages/BSL/alphabet")
        assert resp_alpha.status_code == 200
        assert "alphabet" in resp_alpha.json()

        # POST /api/translation/orchestrate
        resp_orch = await client.post("/api/translation/orchestrate", json={
            "language": "ISL",
            "signs": [{"label": "PLEASE", "confidence": 0.91}, {"label": "WATER", "confidence": 0.88}]
        })
        assert resp_orch.status_code == 200
        orch_data = resp_orch.json()
        assert orch_data["language"] == "ISL"
        assert len(orch_data["readable_translation"]) > 0

        # Reset language to ISL
        await client.post("/api/languages/select", json={"language_id": "ISL"})
