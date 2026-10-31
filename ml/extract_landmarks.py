"""MediaPipe HandLandmarker wrapper for frame-by-frame and streaming hand detection."""
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision
from mediapipe.tasks.python import BaseOptions

# Hand Landmark Connections for 21 points
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),        # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),        # Index
    (5, 9), (9, 10), (10, 11), (11, 12),   # Middle
    (9, 13), (13, 14), (14, 15), (15, 16), # Ring
    (13, 17), (17, 18), (18, 19), (19, 20),# Pinky
    (0, 17)                                # Palm Base
]

DEFAULT_MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "gesture" / "hand_landmarker.task"


class LandmarkExtractor:
    """Extracts 21 3D landmarks per hand using the MediaPipe Tasks API."""

    def __init__(
        self,
        model_path: Optional[str] = None,
        num_hands: int = 2,
        min_detection_confidence: float = 0.5,
        min_presence_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        self.model_path = str(model_path or DEFAULT_MODEL_PATH)
        if not Path(self.model_path).exists():
            raise FileNotFoundError(
                f"MediaPipe task model not found at {self.model_path}. "
                "Run scripts/download_models.sh first."
            )

        base_options = BaseOptions(model_asset_path=self.model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=num_hands,
            min_hand_detection_confidence=min_detection_confidence,
            min_hand_presence_confidence=min_presence_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

    def extract_from_bgr_frame(
        self, bgr_frame: np.ndarray
    ) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        """Processes a BGR OpenCV frame, extracts hand landmarks,

        and returns both structured landmark data and an annotated frame with drawn skeleton.

        Args:
            bgr_frame: np.ndarray (H, W, 3) in BGR color space

        Returns:
            detected_hands: List of dicts with 'handedness' and 'landmarks'
            annotated_frame: np.ndarray (H, W, 3) with drawn landmark skeleton
        """
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        h, w, _ = bgr_frame.shape

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        detection_result = self.detector.detect(mp_image)

        detected_hands = []
        annotated_frame = bgr_frame.copy()

        if detection_result and detection_result.hand_landmarks:
            num_detected = len(detection_result.hand_landmarks)
            for i in range(num_detected):
                landmarks = detection_result.hand_landmarks[i]
                handedness_label = "Right"
                if i < len(detection_result.handedness):
                    cat = detection_result.handedness[i][0]
                    # Note: MediaPipe mirrors camera handedness; we respect the label or mirror appropriately
                    handedness_label = cat.category_name or "Right"

                lm_list = []
                pixel_points = []
                for lm in landmarks:
                    lm_list.append({"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)})
                    px, py = int(lm.x * w), int(lm.y * h)
                    pixel_points.append((px, py))

                detected_hands.append({
                    "handedness": handedness_label,
                    "landmarks": lm_list
                })

                # Draw skeleton connections
                color = (0, 255, 170) if handedness_label == "Right" else (255, 120, 0)
                for start_idx, end_idx in HAND_CONNECTIONS:
                    if start_idx < len(pixel_points) and end_idx < len(pixel_points):
                        cv2.line(annotated_frame, pixel_points[start_idx], pixel_points[end_idx], color, 2)

                # Draw landmark joints
                for px, py in pixel_points:
                    cv2.circle(annotated_frame, (px, py), 4, (255, 255, 255), -1)
                    cv2.circle(annotated_frame, (px, py), 2, color, -1)

        return detected_hands, annotated_frame

    def close(self):
        """Releases detector resources."""
        if hasattr(self, "detector") and self.detector:
            self.detector.close()
