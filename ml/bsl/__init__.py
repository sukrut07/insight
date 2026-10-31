"""British Sign Language (BSL) ML Pipeline.

Configured for two-handed fingerspelling and distinct BSL dynamic gestures.
Status: Modular pipeline configured; awaiting full dataset training weights.
"""
from pathlib import Path
import json
from typing import Dict, Any, List, Optional

from backend.config import PROJECT_ROOT

CONFIG_PATH = PROJECT_ROOT / "config" / "languages" / "bsl.json"


class BSLRecognitionPipeline:
    """Dedicated BSL recognition pipeline."""

    def __init__(self):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.signs = self.config.get("vocabulary", [])
        self.id_to_label = {s["id"]: s["label"] for s in self.signs}
        self.num_classes = len(self.signs)
        self.status = self.config.get("status", "experimental")

    def predict(self, detected_hands: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Inference for BSL signs.

        Returns model_pending status until BSL trained weights are installed.
        """
        return {
            "language": "BSL",
            "label": "NONE",
            "confidence": 0.0,
            "model_version": self.config.get("model_version", "bsl_v1_prototype"),
            "status": "model_pending",
            "message": "BSL classifier requires trained weights. Reference dictionary and learning modules are active."
        }

    def reset(self):
        pass


bsl_pipeline = BSLRecognitionPipeline()
