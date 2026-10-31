"""Sign Identification Service for SignBridge 2.0.

Integrates real-time landmark features, language configuration, model predictions,
and reference metadata for visual identification and practice matching.
"""
import logging
from typing import Dict, Any, List, Optional
from backend.services.language_router import language_router

logger = logging.getLogger(__name__)


class SignIdentificationService:
    """Matches live tracking and model predictions with authentic sign references."""

    def identify_sign(
        self,
        language: str,
        predicted_label: str,
        confidence: float,
        detected_hands: List[Dict[str, Any]],
        pose_landmarks: Optional[List[Dict[str, Any]]] = None,
        is_stable: bool = False
    ) -> Dict[str, Any]:
        """Synthesizes tracking status, confidence calibration, and reference metadata."""
        lang_upper = language.upper() if language else language_router.get_active_language()
        cfg = language_router.get_language_config(lang_upper) or {}
        vocab = cfg.get("vocabulary", [])

        # Find matching sign reference in active language dictionary
        matched_ref = None
        for item in vocab:
            if item.get("label") == predicted_label:
                matched_ref = item
                break

        # Assess tracking quality
        hand_count = len(detected_hands)
        expected_hands = matched_ref.get("hands", 1) if matched_ref else 1
        
        tracking_status = "tracked"
        if hand_count == 0:
            tracking_status = "lost"
        elif hand_count < expected_hands:
            tracking_status = "occluded"
        elif not is_stable:
            tracking_status = "in_motion"

        # Check uncertainty & alternative suggestions
        min_conf = cfg.get("recognition_thresholds", {}).get("confidence_min", 0.60)
        is_uncertain = confidence < min_conf or tracking_status in ["occluded", "lost"]

        alternatives = []
        if is_uncertain and predicted_label not in ["NONE", "UNKNOWN"]:
            # Provide plausible alternatives from the same language category
            cat = matched_ref.get("category") if matched_ref else None
            for v in vocab:
                if v.get("label") != predicted_label and (v.get("category") == cat or not cat):
                    alternatives.append({
                        "label": v.get("label"),
                        "description": v.get("description", ""),
                        "category": v.get("category", "")
                    })
                if len(alternatives) >= 3:
                    break

        return {
            "language": lang_upper,
            "predicted_sign": predicted_label,
            "confidence": round(confidence, 3),
            "sign_reference_id": matched_ref.get("id") if matched_ref else None,
            "recognition_type": matched_ref.get("type", "dynamic") if matched_ref else "unknown",
            "tracking_status": tracking_status,
            "hands_detected": hand_count,
            "expected_hands": expected_hands,
            "is_stable": is_stable,
            "uncertainty_information": {
                "is_ambiguous": is_uncertain,
                "requires_confirmation": is_uncertain and predicted_label not in ["NONE", "UNKNOWN"],
                "plausible_alternatives": alternatives
            },
            "reference_card_data": {
                "label": matched_ref.get("label") if matched_ref else predicted_label,
                "category": matched_ref.get("category", "general") if matched_ref else "general",
                "description": matched_ref.get("description", "Sign reference in active library.") if matched_ref else "Sign not yet registered in library.",
                "hand_orientation": matched_ref.get("hand_orientation", "Natural posture") if matched_ref else "Natural posture",
                "start_position": matched_ref.get("start_position", "Neutral chest level") if matched_ref else "Neutral chest level",
                "end_position": matched_ref.get("end_position", "Neutral release") if matched_ref else "Neutral release",
                "hands_required": expected_hands
            }
        }


sign_identification_service = SignIdentificationService()
