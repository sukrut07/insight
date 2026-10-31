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
    cfg = language_router.get_language_config(language_id)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Language '{language_id}' not found.")
    return {
        "language_id": language_id.upper(),
        "name": cfg.get("name"),
        "vocabulary": cfg.get("vocabulary", [])
    }


@router.get("/{language_id}/alphabet")
async def get_language_alphabet(language_id: str):
    """Returns manual fingerspelling alphabet for specified language."""
    cfg = language_router.get_language_config(language_id)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Language '{language_id}' not found.")
    return {
        "language_id": language_id.upper(),
        "name": cfg.get("name"),
        "fingerspelling_type": cfg.get("fingerspelling_type"),
        "alphabet_description": cfg.get("alphabet_description"),
        "alphabet": cfg.get("alphabet", [])
    }


@router.get("/{language_id}/config")
async def get_full_language_config(language_id: str):
    """Returns full metadata and thresholds for specified language."""
    cfg = language_router.get_language_config(language_id)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Language '{language_id}' not found.")
    return cfg
