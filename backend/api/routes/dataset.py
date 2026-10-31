"""FastAPI routes for open-source dataset inspection, recording, and export."""
import json
import logging
import os
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.config import settings, PROJECT_ROOT

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dataset", tags=["dataset"])

DATA_RAW_DIR = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


class RecordSampleRequest(BaseModel):
    label: str
    landmarks: List[Any] = Field(..., description="Array of frame landmarks")
    is_sequence: bool = False
    metadata: Optional[Dict[str, Any]] = None


class DatasetClassInfo(BaseModel):
    label: str
    sample_count: int
    is_sequence: bool


class DatasetSummaryResponse(BaseModel):
    total_samples: int
    total_classes: int
    classes: List[DatasetClassInfo]
    storage_path: str
    is_ready_for_training: bool


@router.get("/summary", response_model=DatasetSummaryResponse)
async def get_dataset_summary():
    """Returns dataset metrics, recorded class distribution, and training readiness."""
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    classes_info = []
    total = 0

    if DATA_RAW_DIR.exists():
        for class_dir in sorted(DATA_RAW_DIR.iterdir()):
            if class_dir.is_dir() and not class_dir.name.startswith("."):
                files = list(class_dir.glob("*.npy")) + list(class_dir.glob("*.json"))
                count = len(files)
                total += count
                classes_info.append(
                    DatasetClassInfo(
                        label=class_dir.name,
                        sample_count=count,
                        is_sequence=True
                    )
                )

    return DatasetSummaryResponse(
        total_samples=total,
        total_classes=len(classes_info),
        classes=classes_info,
        storage_path=str(DATA_RAW_DIR.relative_to(PROJECT_ROOT)),
        is_ready_for_training=total >= 50
    )


@router.post("/sample")
async def record_dataset_sample(payload: RecordSampleRequest):
    """Saves a landmark sample or sequence into the open-source dataset repository."""
    clean_label = payload.label.strip().upper()
    target_dir = DATA_RAW_DIR / clean_label
    target_dir.mkdir(parents=True, exist_ok=True)

    timestamp = int(time.time() * 1000)
    filename = f"sample_{timestamp}.json"
    file_path = target_dir / filename

    sample_doc = {
        "label": clean_label,
        "timestamp": timestamp,
        "is_sequence": payload.is_sequence,
        "frame_count": len(payload.landmarks),
        "landmarks": payload.landmarks,
        "metadata": payload.metadata or {}
    }

    try:
        with open(file_path, "w") as f:
            json.dump(sample_doc, f)
        return {
            "status": "saved",
            "file": str(file_path.name),
            "label": clean_label,
            "message": f"Recorded landmark sample for '{clean_label}'"
        }
    except Exception as e:
        logger.error(f"Failed to save sample: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def export_dataset_manifest():
    """Exports structured manifest of recorded dataset for open-source reproducibility."""
    summary = await get_dataset_summary()
    return {
        "dataset_name": "SignBridge ISL Landmark Dataset",
        "format": "MediaPipe Hand Landmarker 21 3D Points",
        "exported_at": time.time(),
        "summary": summary.model_dump(),
        "license": "Apache-2.0",
        "citation": "SignBridge Open-Source ISL Recognition Dataset (ISLRTC Standard Alignment)"
    }
