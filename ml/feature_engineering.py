"""Feature engineering and temporal window buffering for gesture classification."""
from collections import deque
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from ml.normalize import process_dual_hand_landmarks


# Canonical Feature Schema Definition
FEATURE_SCHEMA: Dict[str, int] = {
    "left_hand_coords": 63,   # 21 landmarks * (x, y, z) wrist-normalized
    "right_hand_coords": 63,  # 21 landmarks * (x, y, z) wrist-normalized
    "left_angles": 10,        # PIP & DIP joint angles (5 fingers * 2)
    "right_angles": 10,       # PIP & DIP joint angles (5 fingers * 2)
    "left_present": 1,        # 1.0 if detected, 0.0 otherwise
    "right_present": 1,       # 1.0 if detected, 0.0 otherwise
}
TOTAL_FEATURES: int = sum(FEATURE_SCHEMA.values())
assert TOTAL_FEATURES == 148, f"FEATURE_SCHEMA sum must equal 148, got {TOTAL_FEATURES}"
FEATURE_SCHEMA_VERSION: str = "1.0.0"


def validate_feature_vector(features: np.ndarray, expected_dim: int = TOTAL_FEATURES) -> None:
    """Strictly validates feature dimension.

    Rejects inputs that do not match expected_dim.
    Never silently pads or truncates.
    """
    if not isinstance(features, np.ndarray):
        raise TypeError(f"Expected numpy ndarray, got {type(features)}")

    actual_dim = features.shape[-1]
    if actual_dim != expected_dim:
        raise ValueError(
            f"Feature dimension mismatch: Expected {expected_dim} features "
            f"(schema v{FEATURE_SCHEMA_VERSION}), but got {actual_dim}. "
            "Silent padding or truncation is strictly forbidden."
        )


def extract_features(
    detected_hands: List[Dict[str, Any]],
    metadata_in: Optional[Dict[str, Any]] = None
) -> Tuple[np.ndarray, str, Dict[str, bool], Dict[str, Any]]:
    """Standardized canonical feature extractor interface.

    Args:
        detected_hands: List of hand dictionaries containing 'handedness' and 'landmarks'
        metadata_in: Optional additional metadata dict

    Returns:
        features: Canonical 148-dimensional float32 vector
        schema_version: str version tag
        validity_mask: Dict of boolean flags for modality validity
        metadata: Dict containing extraction details
    """
    raw_126, engineered_148, meta = process_dual_hand_landmarks(detected_hands)
    validate_feature_vector(engineered_148, TOTAL_FEATURES)

    validity_mask = {
        "left_hand_valid": bool(meta.get("left_detected", False)),
        "right_hand_valid": bool(meta.get("right_detected", False)),
        "is_complete": bool(meta.get("left_detected") or meta.get("right_detected"))
    }

    if metadata_in:
        meta.update(metadata_in)
    meta["raw_dim"] = len(raw_126)
    meta["engineered_dim"] = len(engineered_148)
    meta["schema_version"] = FEATURE_SCHEMA_VERSION

    return engineered_148, FEATURE_SCHEMA_VERSION, validity_mask, meta


class TemporalFeatureBuffer:
    """Maintains a rolling FIFO sequence buffer of normalized landmark features
    across a fixed window (default: 30 frames).
    """

    def __init__(self, window_size: int = 30, feature_dim: int = TOTAL_FEATURES):
        self.window_size = window_size
        self.feature_dim = feature_dim
        self.buffer: deque = deque(maxlen=window_size)
        self.raw_history: deque = deque(maxlen=window_size)

    def add_frame(
        self, detected_hands: List[Dict[str, Any]]
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Processes a frame's detected hands and pushes into rolling buffer.

        Returns:
            engineered_features: 148-dim array
            metadata: dict containing hand counts
        """
        engineered_148, schema_ver, validity_mask, metadata = extract_features(detected_hands)
        self.buffer.append(engineered_148)
        self.raw_history.append(metadata.get("raw_coords_126"))
        return engineered_148, metadata

    def is_full(self) -> bool:
        """Checks if buffer has reached full temporal capacity."""
        return len(self.buffer) == self.window_size

    def get_sequence(self) -> np.ndarray:
        """Returns sequence of shape (30, 148).

        If buffer is not full, it pads the earliest available frame backwards.
        """
        if not self.buffer:
            return np.zeros((self.window_size, self.feature_dim), dtype=np.float32)

        arr = np.array(self.buffer, dtype=np.float32)
        if len(arr) < self.window_size:
            # Pad front with first available frame
            pad_len = self.window_size - len(arr)
            pad = np.tile(arr[0:1], (pad_len, 1))
            arr = np.vstack([pad, arr])

        # Validate final output shape
        if arr.shape != (self.window_size, self.feature_dim):
            raise ValueError(f"Temporal buffer sequence shape error: expected ({self.window_size}, {self.feature_dim}), got {arr.shape}")

        return arr

    def clear(self):
        """Clears all buffered frames."""
        self.buffer.clear()
        self.raw_history.clear()

