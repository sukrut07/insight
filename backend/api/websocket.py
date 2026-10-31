"""High-performance WebSocket gateway for live webcam frame streaming and recognition."""
import asyncio
import json
import logging
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.services.landmark_service import landmark_service
from backend.services.gesture_service import gesture_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/recognition")
async def recognition_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket client connected to /ws/recognition")

    prev_time = time.perf_counter()
    fps_estimate = 30.0

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
            except Exception:
                continue

            msg_type = msg.get("type", "frame")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "time": time.time()})
                continue

            elif msg_type == "reset":
                gesture_service.reset_buffer()
                await websocket.send_json({"type": "status", "message": "buffer_reset"})
                continue

            elif msg_type == "frame":
                b64_img = msg.get("image", "")
                if not b64_img:
                    continue

                t_start = time.perf_counter()

                # Run CV landmark extraction in thread pool to prevent event loop blocking
                loop = asyncio.get_event_loop()
                hands, _, annotated_b64 = await loop.run_in_executor(
                    None, landmark_service.process_base64_frame, b64_img
                )

                # Run Gesture Classifier
                pred_result = gesture_service.predict_frame(hands)

                # Compute frame rate
                now = time.perf_counter()
                dt = now - prev_time
                prev_time = now
                if dt > 0:
                    fps_estimate = 0.9 * fps_estimate + 0.1 * (1.0 / dt)

                response_payload = {
                    "type": "recognition_result",
                    "language": pred_result.get("language", "ISL"),
                    "status": pred_result.get("status", "recognized"),
                    "model_version": pred_result.get("model_version", "isl_v1"),
                    "hands_detected": pred_result["hands_detected"],
                    "left_hand": pred_result["left_hand"],
                    "right_hand": pred_result["right_hand"],
                    "label": pred_result["label"],
                    "raw_label": pred_result.get("raw_label", pred_result["label"]),
                    "confidence": round(pred_result["confidence"], 3),
                    "is_stable": pred_result["is_stable"],
                    "new_word_emitted": pred_result["new_word_emitted"],
                    "landmarks": hands,
                    "annotated_frame": annotated_b64,
                    "fps": round(fps_estimate, 1),
                    "latency_ms": round((time.perf_counter() - t_start) * 1000, 1)
                }

                await websocket.send_json(response_payload)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
