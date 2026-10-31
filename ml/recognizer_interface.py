"""Abstract Base Class for Language-Specific Sign Language Recognizers.

Defines the contract for all modular sign language classification, keypoint,
and translation model adapters in iNSIGHT.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np


class SignLanguageRecognizer(ABC):
    """Abstract model interface implemented by all language-specific recognition engines."""

    @abstractmethod
    def load(self, checkpoint_path: Optional[str] = None) -> bool:
        """Loads weights, validates metadata, and checks input dimension compatibility."""
        pass

    @abstractmethod
    def predict_frame(
        self,
        detected_hands: List[Dict[str, Any]],
        holistic_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Performs single-frame or rolling temporal inference."""
        pass

    @abstractmethod
    def predict_sequence(self, sequence: np.ndarray) -> Dict[str, Any]:
        """Performs inference on a fixed temporal window sequence (e.g. 30 frames)."""
        pass

    @abstractmethod
    def get_vocabulary(self) -> List[Dict[str, Any]]:
        """Returns verified vocabulary metadata for this language."""
        pass

    @abstractmethod
    def get_model_metadata(self) -> Dict[str, Any]:
        """Returns model version, architecture, parameter count, and evaluation metrics."""
        pass

    @abstractmethod
    def reset(self) -> None:
        """Clears temporal sequence and hidden buffers."""
        pass
