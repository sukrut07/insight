"""Translation refinement and user feedback endpoints."""
from fastapi import APIRouter
from backend.schemas.translation import (
    TranslationRefineRequest,
    TranslationRefineResponse,
    FeedbackSubmitRequest,
    FeedbackSubmitResponse,
)
from backend.services.gemma_service import gemma_service
from backend.services.feedback_service import feedback_service
from backend.database.models import add_translation_history

router = APIRouter(tags=["translation"])


@router.post("/translation/refine", response_model=TranslationRefineResponse)
async def refine_translation(payload: TranslationRefineRequest):
    signs_data = [s.model_dump() for s in payload.signs]
    result = await gemma_service.refine_translation(
        signs_data, custom_instruction=payload.custom_instruction
    )

    # Save to history database if refined sentence was produced
    if result["refined_sentence"]:
        add_translation_history(
            raw_tokens=result["original_tokens"],
            refined_sentence=result["refined_sentence"],
            model_used=result["model_used"]
        )

    return TranslationRefineResponse(
        refined_sentence=result["refined_sentence"],
        original_tokens=result["original_tokens"],
        alternatives=result.get("alternatives", []),
        notes=result.get("notes"),
        model_used=result["model_used"],
        execution_time_ms=result["execution_time_ms"],
        is_fallback=result["is_fallback"]
    )


@router.post("/translation/feedback", response_model=FeedbackSubmitResponse)
async def submit_feedback(payload: FeedbackSubmitRequest):
    feedback_id = feedback_service.record_correction(
        predicted_label=payload.predicted_label,
        corrected_label=payload.corrected_label,
        confidence=payload.confidence,
        landmark_data=payload.landmark_data
    )
    return FeedbackSubmitResponse(
        status="recorded",
        feedback_id=feedback_id,
        message="User correction recorded locally for future model calibration."
    )


@router.post("/translation/orchestrate")
async def orchestrate_translation(payload: dict):
    """SignBridge 2.0 Central Gemma 4 E4B Multilingual Orchestration Endpoint."""
    from backend.services.translation_orchestrator import translation_orchestrator

    lang = payload.get("language")
    tokens = payload.get("signs") or payload.get("tokens") or []
    visual_b64 = payload.get("visual_frame_base64")
    context_notes = payload.get("context_notes")

    result = await translation_orchestrator.translate_sequence(
        language=lang,
        tokens=tokens,
        visual_frame_base64=visual_b64,
        context_notes=context_notes
    )

    if result.get("readable_translation"):
        add_translation_history(
            raw_tokens=result.get("recognized_sequence", []),
            refined_sentence=result.get("readable_translation", ""),
            model_used=f"{result.get('model', 'gemma4:e4b')} ({result.get('language', 'ISL')})"
        )

    return result


@router.post("/translation/identify")
async def identify_sign(payload: dict):
    """SignBridge 2.0 Visual Sign Identification Endpoint."""
    from backend.services.translation_orchestrator import translation_orchestrator

    return translation_orchestrator.identify_current_sign(
        language=payload.get("language"),
        label=payload.get("label", "NONE"),
        confidence=float(payload.get("confidence", 0.0)),
        detected_hands=payload.get("detected_hands", []),
        pose_landmarks=payload.get("pose_landmarks"),
        is_stable=bool(payload.get("is_stable", False))
    )

