"""Text-to-Speech endpoints."""
from fastapi import APIRouter
from backend.schemas.translation import SpeakRequest, SpeakResponse
from backend.services.tts_service import tts_service

router = APIRouter(tags=["speech"])


@router.post("/speech/speak", response_model=SpeakResponse)
async def speak_text(payload: SpeakRequest):
    success = await tts_service.speak(
        text=payload.text,
        voice=payload.voice,
        rate=payload.rate
    )
    return SpeakResponse(
        status="speaking" if success else "failed",
        text=payload.text,
        voice=payload.voice or tts_service.default_voice
    )


@router.post("/speech/stop")
async def stop_speech():
    tts_service.stop()
    return {"status": "stopped"}


@router.get("/speech/voices")
async def list_voices():
    return {"voices": tts_service.get_available_voices()}
