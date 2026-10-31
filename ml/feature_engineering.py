"""Feature engineering and temporal window buffering for gesture classification."""
from collections import deque
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from ml.normalize import process_dual_hand_landmarks


class TemporalFeatureBuffer:
    """Maintains a rolling FIFO sequence buffer of normalized landmark features

    across a fixed window (default: 30 frames).
    """

    def __init__(self, window_size: int = 30, feature_dim: int = 148):
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
        raw_126, engineered_148, metadata = process_dual_hand_landmarks(detected_hands)
        self.buffer.append(engineered_148)
        self.raw_history.append(raw_126)
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

        return arr

    def clear(self):
        """Clears all buffered frames."""
        self.buffer.clear()
        self.raw_history.clear()
