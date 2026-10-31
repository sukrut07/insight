"""Service managing MediaPipe LandmarkExtractor instance with resilient lazy loading."""
import base64
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from backend.config import settings

logger = logging.getLogger(__name__)

try:
    import cv2
    from ml.extract_landmarks import LandmarkExtractor
    LANDMARK_CV_AVAILABLE = True
except Exception as e:
    cv2 = None
    LandmarkExtractor = None
    LANDMARK_CV_AVAILABLE = False
    logger.info("MediaPipe/OpenCV not available in this runtime environment (lightweight API mode).")


class LandmarkService:
    def __init__(self):
        self._extractor: Optional[Any] = None
        self._init_attempted: bool = False

    def is_available(self) -> bool:
        """Returns True if local MediaPipe landmark extractor can be loaded."""
        return LANDMARK_CV_AVAILABLE and settings.HAND_LANDMARKER_MODEL.exists()

    def _get_extractor(self) -> Optional[Any]:
        if not self._init_attempted:
            self._init_attempted = True
            if self.is_available():
                try:
                    self._extractor = LandmarkExtractor(model_path=str(settings.HAND_LANDMARKER_MODEL))
                except Exception as e:
                    logger.warning(f"Could not initialize LandmarkExtractor: {e}")
                    self._extractor = None
        return self._extractor

    def process_bgr(self, bgr_frame: np.ndarray) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        extractor = self._get_extractor()
        if extractor is None:
            return [], np.zeros((100, 100, 3), dtype=np.uint8)
        return extractor.extract_from_bgr_frame(bgr_frame)

    def process_base64_frame(self, base64_image_data: str) -> Tuple[List[Dict[str, Any]], np.ndarray, str]:
        """Decodes base64 JPEG/PNG frame, extracts landmarks,

        and returns (hands, annotated_frame, base64_annotated_jpeg).
        """
        if not LANDMARK_CV_AVAILABLE or cv2 is None:
            return [], np.zeros((100, 100, 3), dtype=np.uint8), ""

        extractor = self._get_extractor()
        if extractor is None:
            return [], np.zeros((100, 100, 3), dtype=np.uint8), ""

        # Strip data URL prefix if present
        if "," in base64_image_data:
            base64_image_data = base64_image_data.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(base64_image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return [], np.zeros((100, 100, 3), dtype=np.uint8), ""

            hands, annotated = extractor.extract_from_bgr_frame(frame)

            # Encode annotated image back to base64 jpeg for client overlay
            _, buffer = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            annotated_b64 = base64.b64encode(buffer).decode("utf-8")

            return hands, annotated, f"data:image/jpeg;base64,{annotated_b64}"
        except Exception as e:
            logger.error(f"Error processing base64 frame: {e}")
            return [], np.zeros((100, 100, 3), dtype=np.uint8), ""

    def close(self):
        if self._extractor is not None:
            try:
                self._extractor.close()
            except Exception:
                pass
            self._extractor = None


landmark_service = LandmarkService()
