"""Service managing gesture prediction, language-specific routing, and smoothing."""
from typing import List, Dict, Any, Optional
from ml.predict import GesturePredictor
from backend.services.language_router import language_router


class GestureService:
    def __init__(self):
        # ISL Predictor (currently trained)
        self.isl_predictor = GesturePredictor()

    def predict_frame(
        self,
        detected_hands: List[Dict[str, Any]],
        language: Optional[str] = None,
        session: Optional[Any] = None,
        pose_landmarks: Optional[List[Dict[str, float]]] = None,
        face_landmarks: Optional[List[Dict[str, float]]] = None,
    ) -> Dict[str, Any]:
        """Predicts gesture label for incoming frame with session isolation and state machine."""
        # Determine language (priority: session -> parameter -> router default)
        if session is not None and hasattr(session, "language"):
            active_lang = session.language
            predictor = session.predictor
            state_machine = session.state_machine
        else:
            active_lang = (language or language_router.get_active_language()).upper()
            predictor = self.isl_predictor
            state_machine = None

        if active_lang in ["ISL", "BSL", "ASL"]:
            from ml.model_registry import model_registry
            recognizer = model_registry.get_recognizer(active_lang)
            raw_res = recognizer.predict_frame(detected_hands)
            lbl = raw_res.get("label", "NONE")
            conf = float(raw_res.get("confidence", 0.0))
            hands_count = raw_res.get("hands_detected", len(detected_hands))

            # Run state machine if available for temporal hysteresis & uncertainty gating
            state_info = None
            if state_machine is not None:
                non_manual = []
                # Check for non-manual markers if holistic landmarks present
                if face_landmarks or pose_landmarks:
                    from ml.holistic_features import holistic_extractor
                    fused = holistic_extractor.fuse_features(detected_hands, pose_landmarks, face_landmarks)
                    non_manual = fused.get("non_manual_markers", [])

                state_info = state_machine.update_frame(
                    predicted_label=lbl,
                    confidence=conf,
                    is_hands_present=hands_count > 0,
                    non_manual_markers=non_manual,
                )

            formatted = language_router.format_prediction_result(
                label=lbl,
                confidence=conf,
                recognition_type=raw_res.get("recognition_type", "dynamic" if lbl in ["HELLO", "GOODBYE", "THANK_YOU", "PLEASE", "SORRY", "HELP", "FOOD", "WHAT", "WHERE", "NAME", "WANT", "NEED"] else "static"),
                is_stable=state_info.get("is_stable", raw_res.get("is_stable", False)) if state_info else raw_res.get("is_stable", False),
                raw_prediction=raw_res
            )

            has_left = any(h.get("handedness") == "Left" for h in detected_hands) or raw_res.get("left_hand", False)
            has_right = any(h.get("handedness") == "Right" for h in detected_hands) or raw_res.get("right_hand", False)

            # Merge hand detection & stream metadata
            formatted.update({
                "language": active_lang,
                "hands_detected": hands_count,
                "left_hand": has_left,
                "right_hand": has_right,
                "new_word_emitted": state_info.get("new_segment_emitted", {}).get("gloss") if (state_info and state_info.get("new_segment_emitted")) else raw_res.get("new_word_emitted"),
                "raw_label": raw_res.get("raw_label", lbl),
                "state": state_info.get("state") if state_info else formatted.get("status"),
                "sentence_boundary": state_info.get("sentence_boundary", False) if state_info else False,
                "non_manual_markers": state_info.get("non_manual_markers", []) if state_info else []
            })
            return formatted

        # Fallback
        return {
            "language": active_lang,
            "label": "NONE",
            "raw_label": "NONE",
            "confidence": 0.0,
            "model_version": "unknown",
            "recognition_type": "none",
            "status": "unsupported",
            "state": "unsupported",
            "is_stable": False,
            "new_word_emitted": None,
            "hands_detected": len(detected_hands),
            "left_hand": False,
            "right_hand": False,
            "sentence_boundary": False,
            "non_manual_markers": []
        }

    def reset_buffer(self, session: Optional[Any] = None):
        if session is not None and hasattr(session, "reset_buffer"):
            session.reset_buffer()
        else:
            self.isl_predictor.reset()


gesture_service = GestureService()
