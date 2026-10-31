"""Unit and integration tests for Unified AI Model Orchestrator."""
import pytest
from backend.services.model_orchestrator import (
    model_orchestrator,
    ModelRequest,
    ModelResponse,
    TaskType,
    ProviderType,
    extract_json_from_text,
    DeterministicRuleProvider,
    GeminiProvider,
    OllamaGemmaE4BProvider,
    OllamaGemmaE2BProvider
)


def test_extract_json_from_text():
    # Direct JSON
    assert extract_json_from_text('{"status": "ok", "value": 42}') == {"status": "ok", "value": 42}
    # Markdown block
    md = '```json\n{"action": "test", "confirmed": true}\n```'
    assert extract_json_from_text(md) == {"action": "test", "confirmed": True}
    # Empty
    assert extract_json_from_text("") is None
    assert extract_json_from_text("Invalid non-json output") is None


@pytest.mark.asyncio
async def test_deterministic_provider():
    provider = DeterministicRuleProvider()
    assert await provider.is_available() is True

    req = ModelRequest(
        prompt="Recognized signs: HELLO THANK_YOU PLEASE",
        task_type=TaskType.TEXT_FORMATTING
    )
    resp = await provider.generate(req)
    assert resp.status == "success"
    assert resp.provider == ProviderType.DETERMINISTIC.value
    assert resp.parsed_json is not None
    assert "sentence" in resp.parsed_json
    assert resp.is_fallback is True


@pytest.mark.asyncio
async def test_gemini_provider_unconfigured():
    provider = GeminiProvider()
    # If no key, is_available is False
    provider.api_key = ""
    assert await provider.is_available() is False

    req = ModelRequest(
        prompt="Test prompt",
        task_type=TaskType.LINGUISTIC_RECONSTRUCTION,
        allow_cloud=True
    )
    resp = await provider.generate(req)
    assert resp.status == "error"
    assert "Gemini API key is not configured" in (resp.error_message or "")


@pytest.mark.asyncio
async def test_gemini_provider_consent_gating():
    provider = GeminiProvider()
    provider.api_key = "AIzaFakeTestKeyForUnitTestingOnly1234567"
    # Even if key is present, if allow_cloud is False, it should block cloud transmission
    req = ModelRequest(
        prompt="Test prompt",
        task_type=TaskType.LINGUISTIC_RECONSTRUCTION,
        allow_cloud=False
    )
    resp = await provider.generate(req)
    assert resp.status == "error"
    assert "Cloud inference blocked" in (resp.error_message or "")


@pytest.mark.asyncio
async def test_orchestrator_status_reporting():
    status = await model_orchestrator.get_provider_status()
    assert "active_provider" in status
    assert "active_model" in status
    assert "providers" in status
    assert ProviderType.OLLAMA_E4B.value in status["providers"]
    assert ProviderType.OLLAMA_E2B.value in status["providers"]
    assert ProviderType.GEMINI_API.value in status["providers"]
    assert ProviderType.DETERMINISTIC.value in status["providers"]
