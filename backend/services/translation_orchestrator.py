"""Translation Orchestrator Service for SignBridge 2.0.

Orchestrates the complete pipeline:
Language Selection -> Stable Sign Tokens -> Vocabulary Validation ->
Visual Evidence Processing -> Gemma 4 E4B Orchestration -> Readable Translation.
"""
import logging
from typing import Dict, Any, List, Optional

from backend.services.language_router import language_router
from backend.services.gemma_orchestrator import gemma_orchestrator
from backend.services.sign_identification import sign_identification_service

logger = logging.getLogger(__name__)


class TranslationOrchestrator:
    """Coordinates multilingual sign sequence translation with AI reasoning."""

    async def translate_sequence(
        self,
        language: Optional[str] = None,
        tokens: Optional[List[Dict[str, Any]]] = None,
        visual_frame_base64: Optional[str] = None,
        context_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Translates recognized sign sequence into natural English communication."""
        active_lang = (language or language_router.get_active_language()).upper()
        tokens_list = tokens or []

        # Validate against language configuration
        cfg = language_router.get_language_config(active_lang) or {}
        model_status = cfg.get("status", "experimental")

        # Gemma orchestration
        orchestrated = await gemma_orchestrator.orchestrate_translation(
            language=active_lang,
            recognized_signs=tokens_list,
            visual_frame_base64=visual_frame_base64,
            context_notes=context_notes
        )

        # Attach language-specific metadata
        orchestrated["language_name"] = cfg.get("name", active_lang)
        orchestrated["model_status"] = model_status
        orchestrated["fingerspelling_type"] = cfg.get("fingerspelling_type", "unknown")

        return orchestrated

    def identify_current_sign(
        self,
        language: Optional[str],
        label: str,
        confidence: float,
        detected_hands: List[Dict[str, Any]],
        pose_landmarks: Optional[List[Dict[str, Any]]] = None,
        is_stable: bool = False
    ) -> Dict[str, Any]:
        """Identifies active sign and matches visual reference card."""
        active_lang = (language or language_router.get_active_language()).upper()
        return sign_identification_service.identify_sign(
            language=active_lang,
            predicted_label=label,
            confidence=confidence,
            detected_hands=detected_hands,
            pose_landmarks=pose_landmarks,
            is_stable=is_stable
        )


translation_orchestrator = TranslationOrchestrator()
