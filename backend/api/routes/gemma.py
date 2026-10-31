"""FastAPI routes for Gemma 4 multimodal visual reasoning, model comparison, and evaluation."""
import time
import uuid
from fastapi import APIRouter, HTTPException
from backend.schemas.gemma import (
    MultimodalInspectRequest,
    MultimodalInspectResponse,
    DisagreementActionRequest,
    ModelCompareRequest,
    ModelCompareResponse,
    ModelBenchmarkResult,
    GemmaSettingsUpdate,
    GemmaEvaluationStats
)
from backend.services.gemma_service import gemma_service

router = APIRouter(prefix="/gemma", tags=["gemma"])


@router.post("/inspect", response_model=MultimodalInspectResponse)
async def inspect_gesture_multimodal(payload: MultimodalInspectRequest):
    """Layer 2 Multimodal Visual Inspection.

    Sends selected stabilized hand image and classifier prediction to Gemma 4
    for visual consistency verification, discrepancy detection, and AI explanation.
    """
    res = await gemma_service.inspect_gesture_multimodal(
        image_base64=payload.image_base64,
        predicted_label=payload.predicted_label,
        confidence=payload.confidence,
        hands_detected=payload.hands_detected,
        left_hand_present=payload.left_hand_present,
        right_hand_present=payload.right_hand_present,
        landmarks_summary=payload.landmarks_summary,
        custom_instruction=payload.custom_instruction,
        user_consent_cloud=payload.user_consent_cloud
    )
    return MultimodalInspectResponse(**res)


@router.get("/evaluation", response_model=GemmaEvaluationStats)
async def get_gemma_evaluation():
    """Returns genuine evaluation metrics, active provider, latency, and recent disagreement logs."""
    stats = gemma_service.get_evaluation_stats()
    return GemmaEvaluationStats(**stats)


@router.get("/providers")
async def get_provider_status():
    """Returns status and readiness across Gemini API, Ollama E4B, and Ollama E2B."""
    from backend.services.model_orchestrator import model_orchestrator
    return await model_orchestrator.get_provider_status()


@router.post("/disagreement/action")
async def handle_disagreement_action(payload: DisagreementActionRequest):
    """Resolves a visual/classifier disagreement through human-in-the-loop review."""
    success = gemma_service.resolve_disagreement(
        event_id=payload.event_id,
        action=payload.action,
        corrected_label=payload.corrected_label
    )
    if not success:
        raise HTTPException(status_code=404, detail="Disagreement event not found")
    return {"status": "resolved", "action": payload.action, "event_id": payload.event_id}


@router.post("/compare", response_model=ModelCompareResponse)
async def compare_models(payload: ModelCompareRequest):
    """Benchmarks E4B vs E2B vs Gemini API side-by-side."""
    results_raw = await gemma_service.compare_models(
        sample_signs=payload.sample_signs,
        image_base64=payload.image_base64,
        predicted_label=payload.predicted_label or "HELLO",
        confidence=payload.confidence or 0.90
    )
    items = [ModelBenchmarkResult(**r) for r in results_raw]
    return ModelCompareResponse(
        benchmark_id=str(uuid.uuid4())[:8],
        results=items
    )


@router.post("/settings")
async def update_gemma_settings(payload: GemmaSettingsUpdate):
    """Configures active provider (local_ollama vs gemini_api), models, and consent."""
    if payload.provider:
        if payload.provider not in ["local_ollama", "gemini_api"]:
            raise HTTPException(status_code=400, detail="Invalid provider. Must be 'local_ollama' or 'gemini_api'.")
        gemma_service.provider = payload.provider

    if payload.primary_model:
        gemma_service.primary_model = payload.primary_model

    if payload.fallback_model:
        gemma_service.fallback_model = payload.fallback_model

    if payload.gemini_api_key is not None:
        gemma_service.gemini_api_key = payload.gemini_api_key

    if payload.gemini_model:
        gemma_service.gemini_model = payload.gemini_model

    if payload.cloud_consent is not None:
        gemma_service.cloud_consent_granted = payload.cloud_consent

    return {
        "status": "settings_updated",
        "provider": gemma_service.provider,
        "primary_model": gemma_service.primary_model,
        "fallback_model": gemma_service.fallback_model,
        "cloud_consent": gemma_service.cloud_consent_granted,
        "has_api_key": bool(gemma_service.gemini_api_key)
    }
