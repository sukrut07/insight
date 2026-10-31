"""User feedback and correction storage service."""
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

from backend.config import settings
from backend.database.models import add_user_feedback, get_feedback_count


class FeedbackService:
    def __init__(self):
        self.feedback_dir = settings.FEEDBACK_DIR
        self.feedback_dir.mkdir(parents=True, exist_ok=True)

    def record_correction(
        self,
        predicted_label: str,
        corrected_label: str,
        confidence: float,
        landmark_data: Optional[Any] = None
    ) -> int:
        """Stores correction to local SQLite and saves raw landmark array file."""
        timestamp = int(time.time())

        # Save binary array file in feedback/ if landmark array is provided
        file_ref = None
        if landmark_data is not None:
            try:
                arr = np.array(landmark_data, dtype=np.float32)
                file_path = self.feedback_dir / f"feedback_{corrected_label}_{timestamp}.npy"
                np.save(file_path, arr)
                file_ref = str(file_path.name)
            except Exception:
                file_ref = None

        db_payload = {
            "file_ref": file_ref,
            "raw": landmark_data if file_ref is None else None
        }

        feedback_id = add_user_feedback(
            predicted_label=predicted_label,
            corrected_label=corrected_label,
            confidence=confidence,
            landmark_data=db_payload
        )
        return feedback_id

    def get_stats(self) -> Dict[str, Any]:
        count = get_feedback_count()
        files = list(self.feedback_dir.glob("*.npy"))
        return {
            "total_feedback_entries": count,
            "saved_feedback_landmark_files": len(files)
        }


feedback_service = FeedbackService()
