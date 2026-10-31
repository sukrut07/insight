"""Indian Sign Language (ISL) ML Pipeline.

Trained on ISLRTC standards and continuous ISL gesture sequences.
Integrates static Random Forest and temporal LSTM classifiers.
"""
from pathlib import Path
import json
from typing import Dict, Any, List, Optional
import numpy as np

from backend.config import PROJECT_ROOT
from ml.feature_engineering import TemporalFeatureBuffer
from ml.models.static_classifier import StaticGestureClassifier
from ml.models.lstm_classifier import TemporalGestureClassifier

CONFIG_PATH = PROJECT_ROOT / "config" / "languages" / "isl.json"
MODELS_DIR = PROJECT_ROOT / "models" / "gesture"


class ISLRecognitionPipeline:
    """Dedicated ISL gesture recognition pipeline."""

    def __init__(self):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.signs = self.config.get("vocabulary", [])
        self.id_to_label = {s["id"]: s["label"] for s in self.signs}
        self.num_classes = len(self.signs)

        # Classifiers
        self.static_clf: Optional[StaticGestureClassifier] = None
        self.temporal_clf: Optional[TemporalGestureClassifier] = None

        rf_path = MODELS_DIR / "static_rf.joblib"
        if rf_path.exists():
            self.static_clf = StaticGestureClassifier(model_type="rf", num_classes=self.num_classes)
            self.static_clf.load(str(rf_path))

        lstm_path = MODELS_DIR / "temporal_lstm.pt"
        if lstm_path.exists():
            self.temporal_clf = TemporalGestureClassifier(num_classes=self.num_classes)
            self.temporal_clf.load(str(lstm_path))

        self.feature_buffer = TemporalFeatureBuffer(window_size=30, feature_dim=148)

    def predict(self, detected_hands: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not detected_hands:
            return {"label": "NONE", "confidence": 1.0, "status": "no_hands"}

        engineered_148, _ = self.feature_buffer.add_frame(detected_hands)
        label = "UNKNOWN"
        confidence = 0.0

        if self.temporal_clf and self.feature_buffer.is_full():
            seq = self.feature_buffer.get_sequence()
            pred_id, conf = self.temporal_clf.predict(seq)
            if conf >= 0.60:
                label = self.id_to_label.get(pred_id, "UNKNOWN")
                confidence = conf

        if label == "UNKNOWN" and self.static_clf:
            pred_id, conf = self.static_clf.predict(engineered_148)
            if conf >= 0.60:
                label = self.id_to_label.get(pred_id, "UNKNOWN")
                confidence = conf

        return {
            "language": "ISL",
            "label": label,
            "confidence": float(confidence),
            "model_version": self.config.get("model_version", "isl_v1"),
            "status": "recognized" if label not in ["NONE", "UNKNOWN"] else "uncertain"
        }

    def reset(self):
        self.feature_buffer.reset()


isl_pipeline = ISLRecognitionPipeline()
