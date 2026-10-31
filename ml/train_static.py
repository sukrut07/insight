"""Trains the static gesture classifier (Random Forest baseline and PyTorch MLP)."""
import argparse
from pathlib import Path
import numpy as np
from sklearn.metrics import accuracy_score, classification_report

from ml.models.static_classifier import StaticGestureClassifier

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models" / "gesture"


def train_static(model_type: str = "rf"):
    print(f"=== Training Static Gesture Classifier ({model_type.upper()}) ===")
    train_X = np.load(DATA_DIR / "train" / "static_X.npy")
    train_y = np.load(DATA_DIR / "train" / "static_y.npy")
    val_X = np.load(DATA_DIR / "validation" / "static_X.npy")
    val_y = np.load(DATA_DIR / "validation" / "static_y.npy")
    test_X = np.load(DATA_DIR / "test" / "static_X.npy")
    test_y = np.load(DATA_DIR / "test" / "static_y.npy")

    num_classes = len(np.unique(train_y))
    classifier = StaticGestureClassifier(model_type=model_type, num_classes=num_classes)

    print(f"Training on {len(train_X)} samples across {num_classes} classes...")
    classifier.fit(train_X, train_y)

    # Evaluate on validation
    val_preds = [classifier.predict(x)[0] for x in val_X]
    val_acc = accuracy_score(val_y, val_preds)
    print(f"Validation Accuracy: {val_acc * 100:.2f}%")

    # Evaluate on test
    test_preds = [classifier.predict(x)[0] for x in test_X]
    test_acc = accuracy_score(test_y, test_preds)
    print(f"Test Accuracy: {test_acc * 100:.2f}%")

    # Save model
    save_filename = "static_rf.joblib" if model_type == "rf" else "static_mlp.pt"
    save_path = MODELS_DIR / save_filename
    classifier.save(str(save_path))
    print(f"Model saved to {save_path}")

    return classifier


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-type", choices=["rf", "mlp"], default="rf")
    args = parser.parse_args()
    train_static(args.model_type)
