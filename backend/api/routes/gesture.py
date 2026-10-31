"""Gesture inference endpoint."""
import time
from fastapi import APIRouter
from backend.schemas.gesture import GesturePredictionRequest, GesturePredictionResponse
from backend.services.gesture_service import gesture_service

router = APIRouter(tags=["gesture"])


@router.post("/gesture/predict", response_model=GesturePredictionResponse)
async def predict_gesture(payload: GesturePredictionRequest):
    t0 = time.perf_counter()
    hands_dicts = [h.model_dump() for h in payload.hands]
    result = gesture_service.predict_frame(hands_dicts)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    return GesturePredictionResponse(
        label=result["label"],
        confidence=result["confidence"],
        is_stable=result["is_stable"],
        new_word_emitted=result["new_word_emitted"],
        hands_detected=result["hands_detected"],
        left_hand=result["left_hand"],
        right_hand=result["right_hand"],
        inference_time_ms=elapsed_ms
    )


@router.post("/gesture/reset")
async def reset_gesture_buffer():
    gesture_service.reset_buffer()
    return {"status": "buffer_cleared"}
