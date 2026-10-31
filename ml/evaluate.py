"""Evaluates trained static and temporal models, generating authentic metrics

and confusion matrices saved as JSON for the frontend analytics dashboard.
"""
import json
import time
from pathlib import Path
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score

from ml.models.static_classifier import StaticGestureClassifier
from ml.models.lstm_classifier import TemporalGestureClassifier

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models" / "gesture"
VOCAB_PATH = DATA_DIR / "vocabulary" / "isl_vocabulary.json"
METRICS_PATH = DATA_DIR / "model_metrics.json"


def evaluate_models():
    print("=== Evaluating SignBridge Machine Learning Pipeline ===")

    with open(VOCAB_PATH, "r") as f:
        vocab_data = json.load(f)
    labels = [s["label"] for s in vocab_data["signs"]]
    num_classes = len(labels)

    test_s_X = np.load(DATA_DIR / "test" / "static_X.npy")
    test_s_y = np.load(DATA_DIR / "test" / "static_y.npy")
    test_t_X = np.load(DATA_DIR / "test" / "temporal_X.npy")
    test_t_y = np.load(DATA_DIR / "test" / "temporal_y.npy")

    metrics_output = {
        "evaluated_at": time.time(),
        "total_classes": num_classes,
        "classes": labels,
        "static_model": None,
        "temporal_model": None
    }

    # 1. Evaluate Static Model
    rf_path = MODELS_DIR / "static_rf.joblib"
    if rf_path.exists():
        print("Evaluating Static Random Forest...")
        static_clf = StaticGestureClassifier(model_type="rf", num_classes=num_classes)
        static_clf.load(str(rf_path))

        t0 = time.perf_counter()
        preds = []
        for x in test_s_X:
            p, _ = static_clf.predict(x)
            preds.append(p)
        latency_ms = (time.perf_counter() - t0) / len(test_s_X) * 1000

        acc = accuracy_score(test_s_y, preds)
        precision, recall, f1, _ = precision_recall_fscore_support(
            test_s_y, preds, average="weighted", zero_division=0
        )
        cm = confusion_matrix(test_s_y, preds).tolist()

        metrics_output["static_model"] = {
            "model_type": "RandomForest",
            "test_samples": len(test_s_y),
            "accuracy": float(acc),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "inference_latency_ms": float(latency_ms),
            "confusion_matrix": cm
        }
        print(f"Static Model Accuracy: {acc * 100:.2f}%, Latency: {latency_ms:.2f}ms")

    # 2. Evaluate Temporal Model
    temporal_path = MODELS_DIR / "temporal_lstm.pt"
    if temporal_path.exists():
        print("Evaluating Temporal LSTM...")
        temp_clf = TemporalGestureClassifier(num_classes=num_classes)
        temp_clf.load(str(temporal_path))

        t0 = time.perf_counter()
        preds = []
        for x in test_t_X:
            p, _ = temp_clf.predict(x)
            preds.append(p)
        latency_ms = (time.perf_counter() - t0) / len(test_t_X) * 1000

        acc = accuracy_score(test_t_y, preds)
        precision, recall, f1, _ = precision_recall_fscore_support(
            test_t_y, preds, average="weighted", zero_division=0
        )
        cm = confusion_matrix(test_t_y, preds).tolist()

        metrics_output["temporal_model"] = {
            "model_type": "Bidirectional_LSTM",
            "test_samples": len(test_t_y),
            "accuracy": float(acc),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "inference_latency_ms": float(latency_ms),
            "confusion_matrix": cm
        }
        print(f"Temporal Model Accuracy: {acc * 100:.2f}%, Latency: {latency_ms:.2f}ms")

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_output, f, indent=2)
    print(f"Saved evaluation report to {METRICS_PATH}")


if __name__ == "__main__":
    evaluate_models()
