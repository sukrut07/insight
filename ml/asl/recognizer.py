"""Concrete SignLanguageRecognizer adapter for American Sign Language (ASL).

Configured around:
1. Candidate 1: SharoonArshad/asl-citizen-bigru-attention-encoder-200 (Dynamic ASL vocabulary)
2. Candidate 2: abdollahhh/asl-sign-language-efficientnet-b0 (ASL fingerspelling alphabet)
3. Status: Experimental / Training Phase. Transparently reports readiness status.
"""
from pathlib import Path
import json
from typing import List, Dict, Any, Optional
import numpy as np

from backend.config import PROJECT_ROOT
from ml.recognizer_interface import SignLanguageRecognizer

CONFIG_PATH = PROJECT_ROOT / "config" / "languages" / "asl.json"


class ASLRecognizer(SignLanguageRecognizer):
    """ASL Recognition Engine adapter implementing SignLanguageRecognizer."""

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
            "language": "ASL",
            "label": "NONE",
            "raw_label": "NONE",
            "confidence": 0.0,
            "is_stable": False,
            "recognition_type": "none",
            "hands_detected": len(detected_hands),
            "new_word_emitted": None,
            "status": "model_pending",
            "model_version": self.config.get("model_version", "asl_v1_prototype"),
            "message": (
                "ASL recognition pipeline is in experimental integration. "
                "Hugging Face candidate 'SharoonArshad/asl-citizen-bigru-attention-encoder-200' "
                "and 'abdollahhh/asl-sign-language-efficientnet-b0' are scheduled for benchmark evaluation. "
                "Interactive ASL learning and fingerspelling dictionary are fully active."
            )
        }

    def predict_sequence(self, sequence: np.ndarray) -> Dict[str, Any]:
        return {
            "language": "ASL",
            "label": "NONE",
            "confidence": 0.0,
            "status": "model_pending",
            "model_version": self.config.get("model_version", "asl_v1_prototype"),
        }

    def get_vocabulary(self) -> List[Dict[str, Any]]:
        return list(self.signs)

    def get_model_metadata(self) -> Dict[str, Any]:
        return {
            "language": "ASL",
            "status": "experimental",
            "model_version": self.config.get("model_version", "asl_v1_prototype"),
            "primary_architecture": "BiGRU with Attention Pooling (ASL-Citizen derived)",
            "fingerspelling_architecture": "EfficientNet-B0 (26 alphabet classes)",
            "candidate_evaluations": [
                "SharoonArshad/asl-citizen-bigru-attention-encoder-200",
                "SharoonArshad/asl-citizen-small-transformer-encoder-200",
                "abdollahhh/asl-sign-language-efficientnet-b0",
                "nocontextdoruk/asl-landmark-mlp"
            ],
            "vocabulary_count": self.num_classes,
            "alphabet_count": len(self.alphabet),
        }

    def reset(self) -> None:
        pass
