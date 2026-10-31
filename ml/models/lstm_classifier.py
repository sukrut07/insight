"""Temporal ISL Gesture Classifier: Bidirectional LSTM / GRU."""
from pathlib import Path
from typing import Tuple, Optional
import numpy as np
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
    _BaseModule = nn.Module
except Exception:
    TORCH_AVAILABLE = False
    torch = None
    nn = None
    _BaseModule = object


class TemporalGestureRNN(_BaseModule):
    """Bidirectional LSTM with Attention-pooling for dynamic ISL gesture sequences."""

    def __init__(
        self,
        input_dim: int = 148,
        hidden_dim: int = 128,
        num_layers: int = 2,
        num_classes: int = 15,
        rnn_type: str = "lstm",
        dropout: float = 0.25,
    ):
        super().__init__()
        self.rnn_type = rnn_type.lower()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        if self.rnn_type == "lstm":
            self.rnn = nn.LSTM(
                input_size=input_dim,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True,
                bidirectional=True,
                dropout=dropout if num_layers > 1 else 0.0,
            )
        else:
            self.rnn = nn.GRU(
                input_size=input_dim,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True,
                bidirectional=True,
                dropout=dropout if num_layers > 1 else 0.0,
            )

        # Attention layer over 30 temporal steps
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.Tanh(),
            nn.Linear(64, 1),
            nn.Softmax(dim=1)
        )

        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, seq_len=30, input_dim=148)
        rnn_out, _ = self.rnn(x)  # shape: (batch_size, seq_len, hidden_dim * 2)

        # Attention weighting
        attn_weights = self.attention(rnn_out)  # shape: (batch_size, seq_len, 1)
        context = torch.sum(attn_weights * rnn_out, dim=1)  # shape: (batch_size, hidden_dim * 2)

        logits = self.classifier(context)  # shape: (batch_size, num_classes)
        return logits


class TemporalGestureClassifier:
    """Wrapper managing training, evaluation, and inference of the temporal RNN model."""

    def __init__(
        self,
        input_dim: int = 148,
        hidden_dim: int = 128,
        num_layers: int = 2,
        num_classes: int = 15,
        rnn_type: str = "lstm",
    ):
        self.num_classes = num_classes
        if not TORCH_AVAILABLE:
            self.device = None
            self.model = None
            return

        self.device = torch.device(
            "mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu"
        )
        self.model = TemporalGestureRNN(
            input_dim=input_dim,
            hidden_dim=hidden_dim,
            num_layers=num_layers,
            num_classes=num_classes,
            rnn_type=rnn_type,
        ).to(self.device)

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        epochs: int = 35,
        batch_size: int = 16,
        learning_rate: float = 1e-3,
    ):
        """Fits the RNN on temporal sequence data X: shape (N, 30, 148), y: shape (N,)."""
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=learning_rate, weight_decay=1e-4)

        dataset = torch.utils.data.TensorDataset(
            torch.tensor(X, dtype=torch.float32),
            torch.tensor(y, dtype=torch.long)
        )
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

        self.model.train()
        for epoch in range(epochs):
            for batch_x, batch_y in loader:
                batch_x, batch_y = batch_x.to(self.device), batch_y.to(self.device)
                optimizer.zero_grad()
                outputs = self.model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

    def predict(self, sequence_30x148: np.ndarray) -> Tuple[int, float]:
        """Inference on a single 30-frame sequence (30, 148)."""
        if sequence_30x148.ndim == 2:
            sequence_30x148 = np.expand_dims(sequence_30x148, axis=0)

        expected_dim = self.model.rnn.input_size
        if sequence_30x148.shape[-1] != expected_dim:
            raise ValueError(
                f"Feature dimension mismatch in temporal model: expected input_dim={expected_dim}, "
                f"got {sequence_30x148.shape[-1]}. Silent truncation or padding is forbidden."
            )

        self.model.eval()
        with torch.no_grad():
            tensor_in = torch.tensor(sequence_30x148, dtype=torch.float32).to(self.device)
            logits = self.model(tensor_in)
            probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
            pred_class = int(np.argmax(probs))
            confidence = float(probs[pred_class])
            return pred_class, confidence

    def save(self, filepath: str):
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            "model_state_dict": self.model.state_dict(),
            "num_classes": self.num_classes,
            "input_dim": self.model.rnn.input_size,
            "feature_schema_version": "1.0.0",
            "model_name": "ISL_Temporal_BiLSTM",
            "model_version": "1.0.0"
        }, path)

    def load(self, filepath: str):
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Temporal model checkpoint not found: {path}")
        checkpoint = torch.load(path, map_location=self.device)
        self.num_classes = checkpoint.get("num_classes", self.num_classes)
        expected_dim = checkpoint.get("input_dim", 148)
        if expected_dim != self.model.rnn.input_size:
            raise ValueError(
                f"Incompatible checkpoint: checkpoint expects input_dim={expected_dim}, "
                f"but model initialized with {self.model.rnn.input_size}"
            )
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()

    @classmethod
    def from_checkpoint(cls, filepath: str, device: str = "cpu"):
        """Instantiates and loads TemporalGestureRNN directly from a saved checkpoint."""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Temporal model checkpoint not found: {path}")
        checkpoint = torch.load(path, map_location=device)
        input_dim = checkpoint.get("input_dim", 148)
        num_classes = checkpoint.get("num_classes", 15)
        instance = cls(input_dim=input_dim, num_classes=num_classes)
        instance.model.load_state_dict(checkpoint["model_state_dict"])
        instance.model.eval()
        return instance
