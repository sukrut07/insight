"""Health, model diagnostics, vocabulary, and analytics endpoints."""
import json
import time
from pathlib import Path
from fastapi import APIRouter
try:
    import torch
    HAS_TORCH = True
    HAS_MPS = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
except Exception:
    HAS_TORCH = False
    HAS_MPS = False

from backend.config import settings
from backend.services.gemma_service import gemma_service
from backend.services.feedback_service import feedback_service
from backend.schemas.gesture import VocabularyResponse, VocabularyItem

router = APIRouter(tags=["health"])


@router.get("/health")
async def get_health():
    device = "mps" if HAS_MPS else "cpu"
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "device": device,
        "timestamp": time.time()
    }


@router.get("/models/status")
async def get_model_status():
    from backend.services.model_orchestrator import model_orchestrator
    ollama_info = await gemma_service.check_availability()
    orchestrator_status = await model_orchestrator.get_provider_status()
    return {
        "mediapipe_ready": settings.HAND_LANDMARKER_MODEL.exists(),
        "static_model_loaded": settings.STATIC_MODEL_PATH.exists(),
        "temporal_model_loaded": settings.TEMPORAL_MODEL_PATH.exists(),
        "ollama_available": ollama_info["ollama_online"],
        "primary_model_available": ollama_info["primary_available"],
        "fallback_model_available": ollama_info["fallback_available"],
        "primary_model_name": settings.OLLAMA_PRIMARY_MODEL or settings.PRIMARY_LLM,
        "fallback_model_name": settings.OLLAMA_FALLBACK_MODEL or settings.FALLBACK_LLM,
        "installed_ollama_models": ollama_info["installed_models"],
        "gemini_api_configured": bool(settings.GEMINI_API_KEY.strip()),
        "cloud_consent_granted": settings.CLOUD_CONSENT_GRANTED,
        "active_provider": orchestrator_status["active_provider"],
        "mps_gpu_acceleration": HAS_MPS
    }


from backend.services.vocabulary_service import vocabulary_service
from pydantic import BaseModel


class ExtendVocabularyRequest(BaseModel):
    label: str
    type: str
    hands: int
    category: str
    description: str
    frame_count: int = 30


@router.get("/vocabulary")
async def get_vocabulary():
    data = vocabulary_service.get_all_vocabulary()
    return data


@router.post("/vocabulary/extend")
async def extend_vocabulary(payload: ExtendVocabularyRequest):
    success, msg, new_item = vocabulary_service.register_custom_sign(payload.model_dump())
    if not success:
        return {"status": "error", "message": msg}
    return {"status": "success", "message": msg, "sign": new_item}


@router.get("/analytics")
async def get_analytics():
    metrics = {}
    if settings.METRICS_PATH.exists():
        with open(settings.METRICS_PATH, "r") as f:
            metrics = json.load(f)

    feedback_stats = feedback_service.get_stats()

    return {
        "metrics": metrics,
        "feedback": feedback_stats,
        "is_model_trained": settings.STATIC_MODEL_PATH.exists() and settings.TEMPORAL_MODEL_PATH.exists()
    }
