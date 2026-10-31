"""Service managing MediaPipe LandmarkExtractor instance."""
import base64
from typing import List, Dict, Any, Tuple
import cv2
import numpy as np

from ml.extract_landmarks import LandmarkExtractor
from backend.config import settings


class LandmarkService:
    def __init__(self):
        self.extractor = LandmarkExtractor(model_path=str(settings.HAND_LANDMARKER_MODEL))

    def process_bgr(self, bgr_frame: np.ndarray) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        return self.extractor.extract_from_bgr_frame(bgr_frame)

    def process_base64_frame(self, base64_image_data: str) -> Tuple[List[Dict[str, Any]], np.ndarray, str]:
        """Decodes base64 JPEG/PNG frame, extracts landmarks,

        and returns (hands, annotated_frame, base64_annotated_jpeg).
        """
        # Strip data URL prefix if present
        if "," in base64_image_data:
            base64_image_data = base64_image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(base64_image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return [], np.zeros((100, 100, 3), dtype=np.uint8), ""

        hands, annotated = self.extractor.extract_from_bgr_frame(frame)

        # Encode annotated image back to base64 jpeg for client overlay
        _, buffer = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        annotated_b64 = base64.b64encode(buffer).decode("utf-8")

        return hands, annotated, f"data:image/jpeg;base64,{annotated_b64}"

    def close(self):
        self.extractor.close()


landmark_service = LandmarkService()
