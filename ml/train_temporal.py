"""Trains the temporal ISL gesture classifier (Bidirectional LSTM/GRU)."""
import argparse
from pathlib import Path
import numpy as np
from sklearn.metrics import accuracy_score

from ml.models.lstm_classifier import TemporalGestureClassifier

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "gesture"
CHECKPOINTS_DIR = ROOT_DIR / "models" / "checkpoints"


def train_temporal(rnn_type: str = "lstm", epochs: int = 35):
    print(f"=== Training Temporal Gesture Classifier ({rnn_type.upper()}) ===")
    train_X = np.load(DATA_DIR / "train" / "temporal_X.npy")
    train_y = np.load(DATA_DIR / "train" / "temporal_y.npy")
    val_X = np.load(DATA_DIR / "validation" / "temporal_X.npy")
    val_y = np.load(DATA_DIR / "validation" / "temporal_y.npy")
    test_X = np.load(DATA_DIR / "test" / "temporal_X.npy")
    test_y = np.load(DATA_DIR / "test" / "temporal_y.npy")

    num_classes = len(np.unique(train_y))
    classifier = TemporalGestureClassifier(
        input_dim=148,
        hidden_dim=128,
        num_layers=2,
        num_classes=num_classes,
        rnn_type=rnn_type
    )

    print(f"Device: {classifier.device}")
    print(f"Training on {len(train_X)} temporal sequences (30 frames each) across {num_classes} classes...")
    classifier.fit(train_X, train_y, epochs=epochs, batch_size=32, learning_rate=1e-3)

    # Validation
    val_preds = [classifier.predict(x)[0] for x in val_X]
    val_acc = accuracy_score(val_y, val_preds)
    print(f"Validation Accuracy: {val_acc * 100:.2f}%")

    # Test
    test_preds = [classifier.predict(x)[0] for x in test_X]
    test_acc = accuracy_score(test_y, test_preds)
    print(f"Test Accuracy: {test_acc * 100:.2f}%")

    save_path = CHECKPOINTS_DIR / f"temporal_{rnn_type}.pt"
    classifier.save(str(save_path))
    print(f"Temporal model checkpoint saved to {save_path}")

    # Also save as default gesture model
    default_path = ROOT_DIR / "models" / "gesture" / "temporal_lstm.pt"
    classifier.save(str(default_path))
    print(f"Model also saved to default path {default_path}")

    return classifier


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rnn-type", choices=["lstm", "gru"], default="lstm")
    parser.add_argument("--epochs", type=int, default=30)
    args = parser.parse_args()
    train_temporal(args.rnn_type, args.epochs)
