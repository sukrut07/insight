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


SYSTEM_CHAT_PROMPT = """You are INSIGHT's AI Sign Language & Accessibility Assistant.
Your core mission is to assist users in learning sign language (ISL, BSL, ASL), understanding the dictionary, explaining proper hand orientation, joint angles, movement instructions, and helping troubleshoot why a gesture might not be recognized by the camera.

CRITICAL INSTRUCTIONS:
1. Ground your answers strictly in authentic sign language principles.
2. Clearly distinguish between ISL (Indian Sign Language), BSL (British Sign Language), and ASL (American Sign Language). Remember that ISL and BSL frequently use two-handed fingerspelling alphabets, whereas ASL is single-handed.
3. NEVER fabricate a sign translation or pretend a gesture exists if it is not a verified sign. If uncertain, state clearly: "I don't have verified sign data for that specific term yet."
4. When helping troubleshoot recognition issues, explain:
   - Camera framing: Hands must be fully inside the frame, visible at chest-to-head level.
   - Lighting: Backlighting or dim lighting reduces MediaPipe landmark detection confidence.
   - Hand orientation: Palm direction and finger angles are critical for distinct signs (e.g., flat hand vs open spread vs fist).
   - Motion duration: Dynamic signs (e.g., HELLO wave, THANK YOU chin-to-forward) require 15-30 consecutive frames of movement, not a single snapshot.
   - Left vs Right hand: Single-handed signs may need hand adaptation if performed with the non-dominant hand.
5. Be supportive, concise, accessible, and structured with bullet points where helpful.
"""


@router.post("/chat", response_model=ChatResponse)
async def chat_sign_assistant(payload: ChatRequest):
    """Conversational assistant for sign language concepts, dictionary lookups, and recognition troubleshooting."""
    from backend.services.model_orchestrator import model_orchestrator, ModelRequest, TaskType

    history_str = ""
    if payload.conversation_history:
        for m in payload.conversation_history[-6:]:
            history_str += f"{m.role.capitalize()}: {m.content}\n"

    context_info = f"Current Selected Language: {payload.language_context or 'ISL'}\n"
    if payload.current_sign_context:
        context_info += f"Current Sign Focus: {payload.current_sign_context}\n"

    user_prompt = f"{context_info}\nConversation History:\n{history_str}\nUser Question: {payload.message}\nAssistant:"

    req = ModelRequest(
        prompt=user_prompt,
        system_prompt=SYSTEM_CHAT_PROMPT,
        task_type=TaskType.LINGUISTIC_RECONSTRUCTION,
        temperature=0.6,
        max_tokens=600,
        structured_json=False,
        allow_cloud=payload.allow_cloud
    )

    resp = await model_orchestrator.generate(req)

    if resp.status == "error":
        return ChatResponse(
            response="I am currently having difficulty connecting to the AI language engine. Please check your network connection or API settings, and click retry.",
            provider=resp.provider,
            model=resp.model,
            latency_ms=resp.latency_ms,
            error=resp.error_message
        )

    return ChatResponse(
        response=resp.content.strip(),
        provider=resp.provider,
        model=resp.model,
        latency_ms=resp.latency_ms,
        error=None
    )

