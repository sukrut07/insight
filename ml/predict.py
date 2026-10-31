"""Unified gesture inference pipeline with temporal buffering, rolling smoothing,

confidence thresholding, and word stabilization.
"""
from collections import deque, Counter
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from ml.feature_engineering import TemporalFeatureBuffer
from ml.models.static_classifier import StaticGestureClassifier
from ml.models.lstm_classifier import TemporalGestureClassifier

ROOT_DIR = Path(__file__).resolve().parent.parent
VOCAB_PATH = ROOT_DIR / "data" / "vocabulary" / "isl_vocabulary.json"
MODELS_DIR = ROOT_DIR / "models" / "gesture"


class GesturePredictor:
    """Combines static and temporal models with hysteresis smoothing."""

    def __init__(
        self,
        confidence_threshold: float = 0.60,
        smoothing_window: int = 7,
        stability_count: int = 4,
    ):
        self.confidence_threshold = confidence_threshold
        self.smoothing_window = smoothing_window
        self.stability_count = stability_count

        # Load vocabulary
        with open(VOCAB_PATH, "r") as f:
            vocab_data = json.load(f)
        self.signs = vocab_data["signs"]
        self.id_to_label = {s["id"]: s["label"] for s in self.signs}
        self.id_to_type = {s["id"]: s["type"] for s in self.signs}
        self.num_classes = len(self.signs)

        # Buffers
        self.feature_buffer = TemporalFeatureBuffer(window_size=30, feature_dim=148)
        self.prediction_history: deque = deque(maxlen=smoothing_window)
        self.last_emitted_word: Optional[str] = None
        self.emitted_cooldown: int = 0

        # Load models
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

    def process_frame(
        self, detected_hands: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Processes one frame of detected hands.

        Returns prediction dictionary with smoothed label, confidence, and stability status.
        """
        if self.emitted_cooldown > 0:
            self.emitted_cooldown -= 1

        if not detected_hands:
            # Clear or pause when no hands visible
            self.prediction_history.append(("NONE", 1.0))
            return {
                "label": "NONE",
                "confidence": 1.0,
                "is_stable": False,
                "new_word_emitted": None,
                "hands_detected": 0
            }

        # Add to rolling buffer
        engineered_148, metadata = self.feature_buffer.add_frame(detected_hands)

        # Obtain temporal and static candidates
        label = "UNKNOWN"
        confidence = 0.0

        if self.temporal_clf is not None and self.feature_buffer.is_full():
            seq = self.feature_buffer.get_sequence()
            pred_id, conf = self.temporal_clf.predict(seq)
            if conf >= self.confidence_threshold:
                label = self.id_to_label.get(pred_id, "UNKNOWN")
                confidence = conf

        # Fallback to static model if temporal confidence is low
        if label == "UNKNOWN" and self.static_clf is not None:
            pred_id, conf = self.static_clf.predict(engineered_148)
            if conf >= self.confidence_threshold:
                label = self.id_to_label.get(pred_id, "UNKNOWN")
                confidence = conf
            elif metadata["left_detected"] and not metadata["right_detected"]:
                # Signer adaptation: mirror single left hand to right hand to test single-handed signs
                mirrored_hands = []
                for h in detected_hands:
                    mirrored_pts = [
                        {"x": 1.0 - pt.get("x", 0.0), "y": pt.get("y", 0.0), "z": pt.get("z", 0.0)}
                        for pt in h.get("landmarks", [])
                    ]
                    mirrored_hands.append({
                        "handedness": "Right" if h.get("handedness") == "Left" else "Left",
                        "landmarks": mirrored_pts
                    })
                from ml.normalize import process_dual_hand_landmarks
                _, m_148, _ = process_dual_hand_landmarks(mirrored_hands)
                m_pred_id, m_conf = self.static_clf.predict(m_148)
                if m_conf >= self.confidence_threshold and m_conf > conf:
                    label = self.id_to_label.get(m_pred_id, "UNKNOWN")
                    confidence = m_conf

        self.prediction_history.append((label, confidence))

        # Rolling majority vote smoothing
        labels_in_window = [p[0] for p in self.prediction_history if p[0] not in ("NONE", "UNKNOWN")]
        smoothed_label = label
        is_stable = False
        new_word_emitted = None

        if labels_in_window:
            counts = Counter(labels_in_window)
            most_common, count = counts.most_common(1)[0]
            if count >= self.stability_count:
                smoothed_label = most_common
                is_stable = True

                # Word emission check (deduplication)
                if smoothed_label != self.last_emitted_word and self.emitted_cooldown == 0:
                    new_word_emitted = smoothed_label
                    self.last_emitted_word = smoothed_label
                    self.emitted_cooldown = 15  # Cooldown frames (~0.5s) to avoid repeating same sign

        # Calibrate confidence tiers
        if confidence >= 0.75 and smoothed_label not in ("NONE", "UNKNOWN"):
            confidence_tier = "high"
        elif confidence >= 0.45 and smoothed_label not in ("NONE", "UNKNOWN"):
            confidence_tier = "medium"
        else:
            confidence_tier = "low"

        return {
            "label": smoothed_label if confidence_tier != "low" else "NONE",
            "raw_label": label,
            "confidence": float(confidence),
            "confidence_tier": confidence_tier,
            "is_stable": is_stable,
            "new_word_emitted": new_word_emitted if confidence_tier == "high" else None,
            "hands_detected": metadata["hand_count"],
            "left_hand": metadata["left_detected"],
            "right_hand": metadata["right_detected"]
        }

    def reset(self):
        """Resets tracking buffers and state."""
        self.feature_buffer.clear()
        self.prediction_history.clear()
        self.last_emitted_word = None
        self.emitted_cooldown = 0
