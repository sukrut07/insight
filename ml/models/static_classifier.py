"""Static ISL Gesture Classifiers: Random Forest Baseline & PyTorch MLP."""
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import joblib
import numpy as np
import torch
import torch.nn as nn
from sklearn.ensemble import RandomForestClassifier


class PyTorchStaticMLP(nn.Module):
    """Multi-Layer Perceptron for static ISL hand gesture classification."""

    def __init__(self, input_dim: int = 148, num_classes: int = 15):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.25),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class StaticGestureClassifier:
    """Unified wrapper supporting Scikit-Learn Random Forest and PyTorch MLP."""

    def __init__(self, model_type: str = "rf", num_classes: int = 15):
        self.model_type = model_type.lower()
        self.num_classes = num_classes
        self.rf_model: Optional[RandomForestClassifier] = None
        self.mlp_model: Optional[PyTorchStaticMLP] = None
        self.device = torch.device(
            "mps" if torch.backends.mps.is_available() else "cpu"
        )

        if self.model_type == "rf":
            self.rf_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=16,
                min_samples_split=2,
                random_state=42,
                class_weight="balanced"
            )
        elif self.model_type == "mlp":
            self.mlp_model = PyTorchStaticMLP(input_dim=148, num_classes=num_classes).to(self.device)
        else:
            raise ValueError(f"Unknown model_type: {model_type}")

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Fits the underlying classifier on feature matrix X and labels y."""
        if self.model_type == "rf":
            self.rf_model.fit(X, y)
        elif self.model_type == "mlp":
            self._fit_mlp(X, y)

    def _fit_mlp(self, X: np.ndarray, y: np.ndarray, epochs: int = 40, batch_size: int = 32):
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(self.mlp_model.parameters(), lr=1e-3, weight_decay=1e-4)
        dataset = torch.utils.data.TensorDataset(
            torch.tensor(X, dtype=torch.float32),
            torch.tensor(y, dtype=torch.long)
        )
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        self.mlp_model.train()
        for epoch in range(epochs):
            for batch_x, batch_y in loader:
                batch_x, batch_y = batch_x.to(self.device), batch_y.to(self.device)
                optimizer.zero_grad()
                outputs = self.mlp_model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

    def predict(self, feature_vector: np.ndarray) -> Tuple[int, float]:
        """Predicts class index and confidence probability for a single 1D feature vector."""
        if feature_vector.ndim == 1:
            feature_vector = feature_vector.reshape(1, -1)

        if self.model_type == "rf":
            if self.rf_model is None:
                raise RuntimeError("Random Forest model is not trained.")
            probs = self.rf_model.predict_proba(feature_vector)[0]
            pred_class = int(np.argmax(probs))
            confidence = float(probs[pred_class])
            return pred_class, confidence

        elif self.model_type == "mlp":
            if self.mlp_model is None:
                raise RuntimeError("MLP model is not trained.")
            self.mlp_model.eval()
            with torch.no_grad():
                tensor_in = torch.tensor(feature_vector, dtype=torch.float32).to(self.device)
                logits = self.mlp_model(tensor_in)
                probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                pred_class = int(np.argmax(probs))
                confidence = float(probs[pred_class])
                return pred_class, confidence

    def save(self, filepath: str):
        """Saves model to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        if self.model_type == "rf":
            joblib.dump(self.rf_model, path)
        elif self.model_type == "mlp":
            torch.save(self.mlp_model.state_dict(), path)

    def load(self, filepath: str):
        """Loads model from disk."""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")
        if self.model_type == "rf":
            self.rf_model = joblib.load(path)
        elif self.model_type == "mlp":
            self.mlp_model = PyTorchStaticMLP(input_dim=148, num_classes=self.num_classes).to(self.device)
            self.mlp_model.load_state_dict(torch.load(path, map_location=self.device))
            self.mlp_model.eval()
