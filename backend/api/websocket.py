"""High-performance WebSocket gateway for live webcam frame streaming and recognition.

Features:
- Bounded frame queue (maxsize=1) prioritizing frame freshness and dropping stale frames.
- Session isolation (session_id, per-user language, buffer, and state machine).
- Non-blocking execution of computer vision and ML inference in thread pool.
- Structured telemetry: FPS, inference latency, non-manual markers, state machine status.
- Resilient lifecycle management and clean disconnect disposal.
"""
import asyncio
import json
import logging
import time
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.services.landmark_service import landmark_service
from backend.services.gesture_service import gesture_service
from backend.services.session_manager import session_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/recognition")
async def recognition_websocket(
    websocket: WebSocket,
    session_id: Optional[str] = None,
    language: Optional[str] = None
):
    await websocket.accept()

    # Resolve or create isolated session
    sess_id = session_id or f"sess_{int(time.time() * 1000)}"
    active_lang = (language or "ISL").upper()
    session = session_manager.get_or_create_session(sess_id, active_lang)
    logger.info("WebSocket connected: session_id=%s, language=%s", sess_id, session.language)

    # Bounded queue prioritizing the freshest frame (drops backlog)
    frame_queue: asyncio.Queue = asyncio.Queue(maxsize=1)
    running = True

    # Processing worker task
    async def frame_worker():
        prev_time = time.perf_counter()
        fps_estimate = 30.0

        while running:
            try:
                b64_img = await frame_queue.get()
                t_start = time.perf_counter()

                # Process landmark extraction in executor to avoid blocking event loop
                loop = asyncio.get_event_loop()
                hands, _, annotated_b64 = await loop.run_in_executor(
                    None, landmark_service.process_base64_frame, b64_img
                )

                # Predict gesture with session-scoped state
                pred_result = gesture_service.predict_frame(
                    detected_hands=hands,
                    language=session.language,
                    session=session
                )

                # Compute frame rate
                now = time.perf_counter()
                dt = now - prev_time
                prev_time = now
                if dt > 0:
                    fps_estimate = 0.9 * fps_estimate + 0.1 * (1.0 / dt)

                # Tracking status
                hands_count = pred_result.get("hands_detected", len(hands))
                if hands_count == 0:
                    tracking_status = "no_hands"
                elif hands_count == 1:
                    tracking_status = "tracking_single_hand"
                else:
                    tracking_status = "tracking_active"

                conf = round(pred_result.get("confidence", 0.0), 3)
                conf_tier = pred_result.get("confidence_tier")
                if not conf_tier:
                    conf_tier = "high" if conf >= 0.75 else ("medium" if conf >= 0.45 else "low")

                latency_ms = round((time.perf_counter() - t_start) * 1000, 1)

                response_payload = {
                    "type": "recognition_result",
                    "session_id": session.session_id,
                    "language": session.language,
                    "status": pred_result.get("status", "recognized"),
                    "confidence_tier": conf_tier,
                    "tracking_status": tracking_status,
                    "message": pred_result.get("message", ""),
                    "state": pred_result.get("state", "detecting"),
                    "model_version": pred_result.get("model_version", "isl_v1"),
                    "hands_detected": hands_count,
                    "left_hand": pred_result.get("left_hand", False),
                    "right_hand": pred_result.get("right_hand", False),
                    "label": pred_result.get("label", "NONE"),
                    "raw_label": pred_result.get("raw_label", pred_result.get("label", "NONE")),
                    "confidence": conf,
                    "is_stable": pred_result.get("is_stable", False),
                    "new_word_emitted": pred_result.get("new_word_emitted"),
                    "sentence_boundary": pred_result.get("sentence_boundary", False),
                    "non_manual_markers": pred_result.get("non_manual_markers", []),
                    "landmarks": hands,
                    "annotated_frame": annotated_b64,
                    "fps": round(fps_estimate, 1),
                    "latency_ms": latency_ms
                }

                # Record stable high-confidence recognition to database
                if pred_result.get("new_word_emitted"):
                    try:
                        from backend.database.models import record_recognition_result
                        loop.run_in_executor(
                            None,
                            record_recognition_result,
                            session.session_id,
                            None,
                            conf,
                            conf_tier,
                            latency_ms
                        )
                    except Exception:
                        pass

                await websocket.send_json(response_payload)
                frame_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in frame worker: %s", e)

    worker_task = asyncio.create_task(frame_worker())

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

            elif msg_type == "set_language":
                new_lang = msg.get("language", "ISL").upper()
                session.set_language(new_lang)
                await websocket.send_json({
                    "type": "language_changed",
                    "language": session.language,
                    "session_id": session.session_id
                })
                continue

            elif msg_type == "reset":
                session.reset_buffer()
                await websocket.send_json({
                    "type": "status",
                    "message": "buffer_reset",
                    "session_id": session.session_id
                })
                continue

            elif msg_type == "frame":
                b64_img = msg.get("image", "")
                if not b64_img:
                    continue

                # Bounded queue: If a frame is already pending, drop it to ensure freshness
                if frame_queue.full():
                    try:
                        frame_queue.get_nowait()
                        frame_queue.task_done()
                    except (asyncio.QueueEmpty, ValueError):
                        pass

                await frame_queue.put(b64_img)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for session_id=%s", sess_id)
    except Exception as e:
        logger.error("WebSocket error for session_id=%s: %s", sess_id, e)
    finally:
        running = False
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
