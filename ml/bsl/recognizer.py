"""Concrete SignLanguageRecognizer adapter for British Sign Language (BSL).

Configured around:
1. Candidate 1: signon-project/slr-poseformer-bsl (PoseFormer-based 3D keypoint recognizer)
2. Status: Experimental / Training Phase. Transparently reports readiness status.
"""
from pathlib import Path
import json
from typing import List, Dict, Any, Optional
import numpy as np

from backend.config import PROJECT_ROOT
from ml.recognizer_interface import SignLanguageRecognizer

CONFIG_PATH = PROJECT_ROOT / "config" / "languages" / "bsl.json"


class BSLRecognizer(SignLanguageRecognizer):
    """BSL Recognition Engine adapter implementing SignLanguageRecognizer."""

    def __init__(self):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.signs = self.config.get("vocabulary", [])
        self.alphabet = self.config.get("alphabet", [])
        self.id_to_label = {s["id"]: s["label"] for s in self.signs}
        self.num_classes = len(self.signs)
        self.status = "experimental"

    def load(self, checkpoint_path: Optional[str] = None) -> bool:
        # Candidate weights integration slot
        return True

    def predict_frame(
        self,
        detected_hands: List[Dict[str, Any]],
        holistic_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Inference reporting transparent readiness status."""
        return {
            "language": "BSL",
            "label": "NONE",
            "raw_label": "NONE",
            "confidence": 0.0,
            "is_stable": False,
            "recognition_type": "none",
            "hands_detected": len(detected_hands),
            "new_word_emitted": None,
            "status": "model_pending",
            "model_version": self.config.get("model_version", "bsl_v1_prototype"),
            "message": (
                "BSL recognition pipeline is in experimental integration. "
                "Hugging Face candidate 'signon-project/slr-poseformer-bsl' (SignON EU consortium) "
                "is scheduled for 3D keypoint benchmark evaluation. "
                "Two-handed BSL dictionary and fingerspelling learning modules are active."
            )
        }

    def predict_sequence(self, sequence: np.ndarray) -> Dict[str, Any]:
        return {
            "language": "BSL",
            "label": "NONE",
            "confidence": 0.0,
            "status": "model_pending",
            "model_version": self.config.get("model_version", "bsl_v1_prototype"),
        }

    def get_vocabulary(self) -> List[Dict[str, Any]]:
        return list(self.signs)

    def get_model_metadata(self) -> Dict[str, Any]:
        return {
            "language": "BSL",
            "status": "experimental",
            "model_version": self.config.get("model_version", "bsl_v1_prototype"),
            "primary_architecture": "PoseFormer Spatial-Temporal Transformer (SignON Project)",
            "candidate_evaluations": [
                "signon-project/slr-poseformer-bsl"
            ],
            "vocabulary_count": self.num_classes,
            "alphabet_count": len(self.alphabet),
        }

    def reset(self) -> None:
        pass
