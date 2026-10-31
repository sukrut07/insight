"""End-to-End Latency and Throughput Profiler across the iNSIGHT Pipeline."""
import time
import asyncio
from typing import Dict, Any
import numpy as np

from ml.feature_engineering import extract_features, validate_feature_vector
from ml.models.lstm_classifier import TemporalGestureRNN
from backend.services.model_orchestrator import model_orchestrator, ModelRequest, TaskType
from backend.services.recognition_state_machine import RecognitionStateMachine
from backend.config import settings
import joblib


async def run_latency_profile(iterations: int = 20) -> Dict[str, Any]:
    """Profiles latency (P50, P95, mean) across all pipeline stages."""
    # 1. Feature Extraction (Dummy landmark dict)
    t_feats = []
    dummy_hand = {"landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)], "handedness": "Right"}
    for _ in range(iterations):
        t0 = time.perf_counter()
        vec = extract_features([dummy_hand])
        validate_feature_vector(vec)
        t_feats.append((time.perf_counter() - t0) * 1000)

    # 2. Random Forest Static Inference
    t_rf = []
    if settings.STATIC_MODEL_PATH.exists():
        rf_model = joblib.load(settings.STATIC_MODEL_PATH)
        sample = np.zeros((1, 148), dtype=np.float32)
        for _ in range(iterations):
            t0 = time.perf_counter()
            _ = rf_model.predict(sample)
            t_rf.append((time.perf_counter() - t0) * 1000)

    # 3. BiLSTM Sequence Inference
    t_lstm = []
    if settings.TEMPORAL_MODEL_PATH.exists():
        lstm_model = TemporalGestureRNN.load(str(settings.TEMPORAL_MODEL_PATH))
        seq = np.zeros((30, 148), dtype=np.float32)
        for _ in range(iterations):
            t0 = time.perf_counter()
            _, _ = lstm_model.predict(seq)
            t_lstm.append((time.perf_counter() - t0) * 1000)

    # 4. State Machine Transition
    t_sm = []
    sm = RecognitionStateMachine()
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = sm.process_prediction("HELLO", 0.92, True)
        t_sm.append((time.perf_counter() - t0) * 1000)

    # 5. Deterministic Translation
    t_det = []
    req_det = ModelRequest(prompt="Recognized signs: [HELLO, THANK_YOU]", task_type=TaskType.TEXT_FORMATTING)
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = await model_orchestrator.deterministic.generate(req_det)
        t_det.append((time.perf_counter() - t0) * 1000)

    def stats(arr):
        if not arr:
            return {"mean_ms": 0.0, "p50_ms": 0.0, "p95_ms": 0.0}
        return {
            "mean_ms": round(float(np.mean(arr)), 3),
            "p50_ms": round(float(np.percentile(arr, 50)), 3),
            "p95_ms": round(float(np.percentile(arr, 95)), 3)
        }

    return {
        "iterations": iterations,
        "feature_extraction": stats(t_feats),
        "random_forest_classification": stats(t_rf),
        "bilstm_sequence_classification": stats(t_lstm),
        "state_machine_smoothing": stats(t_sm),
        "deterministic_translation": stats(t_det)
    }


if __name__ == "__main__":
    res = asyncio.run(run_latency_profile(30))
    import json
    print(json.dumps(res, indent=2))
