"""Service managing gesture prediction, language-specific routing, and smoothing."""
from typing import List, Dict, Any
from ml.predict import GesturePredictor
from backend.services.language_router import language_router


class GestureService:
    def __init__(self):
        # ISL Predictor (currently trained)
        self.isl_predictor = GesturePredictor()

    def predict_frame(self, detected_hands: List[Dict[str, Any]]) -> Dict[str, Any]:
        active_lang = language_router.get_active_language()

        if active_lang == "ISL":
            raw_res = self.isl_predictor.process_frame(detected_hands)
            formatted = language_router.format_prediction_result(
                label=raw_res.get("label", "NONE"),
                confidence=raw_res.get("confidence", 0.0),
                recognition_type="dynamic" if raw_res.get("label") in ["HELLO", "GOODBYE", "THANK_YOU", "PLEASE", "SORRY", "HELP", "FOOD", "WHAT", "WHERE"] else "static",
                is_stable=raw_res.get("is_stable", False),
                raw_prediction=raw_res
            )
            # Merge hand detection & stream metadata
            formatted.update({
                "hands_detected": raw_res.get("hands_detected", len(detected_hands)),
                "left_hand": raw_res.get("left_hand", False),
                "right_hand": raw_res.get("right_hand", False),
                "new_word_emitted": raw_res.get("new_word_emitted"),
                "raw_label": raw_res.get("raw_label", raw_res.get("label", "NONE")),
            })
            return formatted

        elif active_lang in ["BSL", "ASL"]:
            # Dedicated pipeline is in experimental/training phase
            cfg = language_router.get_active_config()
            hands_count = len(detected_hands)
            has_left = any(h.get("handedness") == "Left" for h in detected_hands)
            has_right = any(h.get("handedness") == "Right" for h in detected_hands)

            return {
                "language": active_lang,
                "label": "NONE",
                "raw_label": "NONE",
                "confidence": 0.0,
                "model_version": cfg.get("model_version", "prototype"),
                "recognition_type": "none",
                "status": "model_pending",
                "is_stable": False,
                "new_word_emitted": None,
                "hands_detected": hands_count,
                "left_hand": has_left,
                "right_hand": has_right,
                "message": f"{cfg.get('name', active_lang)} classifier is currently in experimental / training phase. Sign reference and visual practice are active."
            }

        # Fallback
        return {
            "language": active_lang,
            "label": "NONE",
            "raw_label": "NONE",
            "confidence": 0.0,
            "model_version": "unknown",
            "recognition_type": "none",
            "status": "unsupported",
            "is_stable": False,
            "new_word_emitted": None,
            "hands_detected": len(detected_hands),
            "left_hand": False,
            "right_hand": False
        }

    def reset_buffer(self):
        self.isl_predictor.reset()


gesture_service = GestureService()
