"""API routes for multilingual language routing and vocabulary management."""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.language_router import language_router

router = APIRouter(prefix="/languages", tags=["languages"])


class LanguageSelectRequest(BaseModel):
    language_id: str


@router.get("", response_model=List[Dict[str, Any]])
async def list_languages():
    """Returns all supported sign languages and their model status."""
    return language_router.get_supported_languages()


@router.get("/models")
async def list_registered_models():
    """Returns registered recognizers, architectures, and candidate evaluations."""
    from ml.model_registry import model_registry
    return model_registry.list_models()


@router.get("/active")
async def get_active_language():
    """Returns currently selected sign language."""
    active_id = language_router.get_active_language()
    cfg = language_router.get_active_config()
    return {
        "active_language": active_id,
        "name": cfg.get("name", active_id),
        "status": cfg.get("status", "unknown"),
        "model_version": cfg.get("model_version", ""),
        "fingerspelling_type": cfg.get("fingerspelling_type", "")
    }


@router.post("/select")
async def select_language(payload: LanguageSelectRequest):
    """Explicitly selects the active sign language (ISL, BSL, or ASL)."""
    success = language_router.set_active_language(payload.language_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"Language '{payload.language_id}' is not supported. Choose from: {language_router.SUPPORTED_LANGUAGES}"
        )
    return {
        "status": "success",
        "active_language": language_router.get_active_language(),
        "config": language_router.get_active_config()
    }


@router.get("/{language_id}/vocabulary")
async def get_language_vocabulary(language_id: str):
    """Returns vocabulary dictionary for specified language."""
    from backend.database.models import get_signs_by_language
    signs = get_signs_by_language(language_id=language_id)
    cfg = language_router.get_language_config(language_id)
    return {
        "language_id": language_id.upper(),
        "name": cfg.get("name") if cfg else language_id.upper(),
        "total": len(signs),
        "vocabulary": signs,
        "signs": signs
    }


@router.get("/{language_id}/signs")
async def get_language_signs(
    language_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """Returns filtered signs and anatomical feature descriptions from database."""
    from backend.database.models import get_signs_by_language
    signs = get_signs_by_language(language_id=language_id, category=category, search=search)
    return {
        "language_id": language_id.upper(),
        "total": len(signs),
        "signs": signs
    }


@router.get("/{language_id}/signs/{sign_id}")
async def get_single_sign_detail(language_id: str, sign_id: str):
    """Returns comprehensive sign detail, features, and model provenance."""
    from backend.database.models import get_sign_detail
    detail = get_sign_detail(sign_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Sign '{sign_id}' not found.")
    return detail


@router.get("/analytics/dictionary")
async def get_dictionary_metrics(language_id: Optional[str] = None):
    """Returns actual dictionary coverage metrics calculated directly from database."""
    from backend.database.models import get_dictionary_analytics
    return get_dictionary_analytics(language_id)


@router.get("/analytics/kpis")
async def get_kpi_metrics(active_language: Optional[str] = None):
    """Returns transparent platform KPI metrics for landing page cards."""
    from backend.database.models import get_platform_kpis
    lang = active_language or language_router.get_active_language()
    return get_platform_kpis(active_language=lang)


@router.get("/{language_id}/alphabet")
async def get_language_alphabet(language_id: str):
    """Returns manual fingerspelling alphabet for specified language."""
    from backend.database.models import get_signs_by_language
    alpha_signs = get_signs_by_language(language_id=language_id, category="alphabet")
    cfg = language_router.get_language_config(language_id)
    return {
        "language_id": language_id.upper(),
        "name": cfg.get("name") if cfg else language_id.upper(),
        "fingerspelling_type": cfg.get("fingerspelling_type") if cfg else "standard",
        "alphabet_description": cfg.get("alphabet_description") if cfg else "",
        "total": len(alpha_signs),
        "alphabet": alpha_signs
    }


@router.get("/{language_id}/config")
async def get_full_language_config(language_id: str):
    """Returns full metadata and thresholds for specified language."""
    cfg = language_router.get_language_config(language_id)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Language '{language_id}' not found.")
    return cfg
