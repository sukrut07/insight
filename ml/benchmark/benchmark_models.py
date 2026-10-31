"""Benchmark evaluation for iNSIGHT static and temporal gesture models on test data."""
import time
import os
from pathlib import Path
from typing import Dict, Any
import numpy as np
import joblib
import torch
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from backend.config import PROJECT_ROOT, settings
from ml.models.lstm_classifier import TemporalGestureRNN


def benchmark_static_model(
    model_path: Path = settings.STATIC_MODEL_PATH,
    test_x_path: Path = PROJECT_ROOT / "data" / "test" / "static_X.npy",
    test_y_path: Path = PROJECT_ROOT / "data" / "test" / "static_y.npy"
) -> Dict[str, Any]:
    """Evaluates the Random Forest static gesture classifier."""
    if not model_path.exists() or not test_x_path.exists():
        return {"status": "NOT EVALUATED", "error": "Model or test dataset missing"}

    t0 = time.perf_counter()
    model = joblib.load(model_path)
    load_time_ms = (time.perf_counter() - t0) * 1000
    model_size_mb = os.path.getsize(model_path) / (1024 * 1024)

    X_test = np.load(test_x_path)
    y_test = np.load(test_y_path)

    # Measure per-sample latency
    latencies = []
    preds = []
    probs = []

    for i in range(len(X_test)):
        sample = X_test[i:i+1]
        t_start = time.perf_counter()
        pred = model.predict(sample)[0]
        prob = np.max(model.predict_proba(sample)[0])
        latencies.append((time.perf_counter() - t_start) * 1000)
        preds.append(pred)
        probs.append(prob)

    preds = np.array(preds)
    acc = accuracy_score(y_test, preds)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, preds, average="macro", zero_division=0)

    # Test unknown sign rejection on random noise
    noise_samples = np.random.uniform(-1.0, 1.0, size=(100, 148))
    noise_probs = [np.max(model.predict_proba(noise_samples[j:j+1])[0]) for j in range(100)]
    rejected_count = sum(1 for p in noise_probs if p < 0.60)
    rejection_rate = (rejected_count / 100.0) * 100.0

    return {
        "model_name": "Random Forest Classifier (Static)",
        "status": "EVALUATED",
        "sample_count": len(X_test),
        "input_dimension": X_test.shape[1],
        "top1_accuracy": round(float(acc), 4),
        "precision_macro": round(float(prec), 4),
        "recall_macro": round(float(rec), 4),
        "f1_macro": round(float(f1), 4),
        "latency_p50_ms": round(float(np.percentile(latencies, 50)), 3),
        "latency_p95_ms": round(float(np.percentile(latencies, 95)), 3),
        "avg_latency_ms": round(float(np.mean(latencies)), 3),
        "load_time_ms": round(load_time_ms, 2),
        "model_size_mb": round(model_size_mb, 2),
        "unknown_rejection_rate": round(rejection_rate, 1)
    }


def benchmark_temporal_model(
    model_path: Path = settings.TEMPORAL_MODEL_PATH,
    test_x_path: Path = PROJECT_ROOT / "data" / "test" / "temporal_X.npy",
    test_y_path: Path = PROJECT_ROOT / "data" / "test" / "temporal_y.npy"
) -> Dict[str, Any]:
    """Evaluates the BiLSTM temporal gesture sequence classifier."""
    if not model_path.exists() or not test_x_path.exists():
        return {"status": "NOT EVALUATED", "error": "Model or test dataset missing"}

    t0 = time.perf_counter()
    model = TemporalGestureRNN.load(str(model_path))
    load_time_ms = (time.perf_counter() - t0) * 1000
    model_size_mb = os.path.getsize(model_path) / (1024 * 1024)

    X_test = np.load(test_x_path)
    y_test = np.load(test_y_path)

    latencies = []
    preds = []

    for i in range(len(X_test)):
        seq = X_test[i]
        t_start = time.perf_counter()
        pred, conf = model.predict(seq)
        latencies.append((time.perf_counter() - t_start) * 1000)
        preds.append(pred)

    preds = np.array(preds)
    acc = accuracy_score(y_test, preds)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, preds, average="macro", zero_division=0)

    # Test unknown sign rejection on random noise sequences
    noise_seqs = np.random.uniform(-1.0, 1.0, size=(50, 30, 148))
    noise_rejected = 0
    for j in range(50):
        _, c = model.predict(noise_seqs[j])
        if c < 0.60:
            noise_rejected += 1
    rejection_rate = (noise_rejected / 50.0) * 100.0

    return {
        "model_name": "BiLSTM Sequence Classifier (Temporal)",
        "status": "EVALUATED",
        "sample_count": len(X_test),
        "sequence_shape": list(X_test.shape[1:]),
        "top1_accuracy": round(float(acc), 4),
        "precision_macro": round(float(prec), 4),
        "recall_macro": round(float(rec), 4),
        "f1_macro": round(float(f1), 4),
        "latency_p50_ms": round(float(np.percentile(latencies, 50)), 3),
        "latency_p95_ms": round(float(np.percentile(latencies, 95)), 3),
        "avg_latency_ms": round(float(np.mean(latencies)), 3),
        "throughput_fps": round(1000.0 / float(np.mean(latencies)), 1) if np.mean(latencies) > 0 else 0,
        "load_time_ms": round(load_time_ms, 2),
        "model_size_mb": round(model_size_mb, 2),
        "unknown_rejection_rate": round(rejection_rate, 1)
    }


if __name__ == "__main__":
    print("Running Static Classifier Benchmark...")
    print(benchmark_static_model())
    print("\nRunning Temporal Classifier Benchmark...")
    print(benchmark_temporal_model())
