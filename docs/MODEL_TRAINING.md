# SignBridge Model Training & Machine Learning Architecture

SignBridge uses a two-tier hybrid machine learning architecture to achieve real-time, low-latency gesture recognition across both static poses and temporal motions in Indian Sign Language (ISL).

---

## 1. Feature Engineering & Normalization

For each frame, the MediaPipe Hand Landmarker produces 21 3D hand landmarks:
$L_i = (x_i, y_i, z_i)$ for $i \in [0, 20]$.

```
          [Tip: 4]
          /  [IP: 3]
         /  /  [MCP: 2]
 [CMC: 1]  |
      \    |   [MCP: 5] - [PIP: 6] - [DIP: 7] - [Tip: 8]
       \   |   [MCP: 9] - [PIP: 10] - [DIP: 11] - [Tip: 12]
        \  |   [MCP: 13] - [PIP: 14] - [DIP: 15] - [Tip: 16]
         \ |   [MCP: 17] - [PIP: 18] - [DIP: 19] - [Tip: 20]
       [Wrist: 0]
```

### Transformations Applied:
1. **Translation Invariance**:
   $$\tilde{L}_i = L_i - L_0$$
   Every landmark is offset relative to wrist landmark $L_0$, anchoring the wrist at $(0, 0, 0)$.

2. **Scale Invariance**:
   $$s = \|L_9 - L_0\|_2$$
   All translated coordinates are divided by $s$ (the Euclidean distance from wrist to the middle finger base MCP joint).

3. **Inter-joint Angles & Distances**:
   Angles are calculated across the three joints per finger:
   $$\theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}\right)$$
   This provides rotational robustness independent of camera angle variations.

4. **Dual-Hand Alignment**:
   SignBridge tracks both Left and Right hands. When only one hand is visible, the second hand is padded with explicit zero-vectors and a boolean presence mask flag to prevent false-positive predictions.

---

## 2. Static Gesture Classifier (Random Forest + MLP)

- **Input Dimension**: $126$ normalized coordinates + engineered angles and aspect metrics.
- **Model Architecture**:
  - Baseline: Scikit-learn `RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42)`.
  - Neural Network: PyTorch `MultiLayerPerceptron` with LayerNorm, Dropout ($p=0.2$), ReLU activations, and CrossEntropyLoss.
- **Target ISL Vocabulary**:
  - `YES`, `NO`, `I`, `YOU`, `MY`, `WHAT`, `WHERE`, `WATER`, `FOOD`.
- **Output**: Class prediction + Softmax probability distribution.
- **Confidence Threshold**: Predictions with maximum softmax probability $< 0.70$ are classified as `UNKNOWN`.

---

## 3. Dynamic Gesture Classifier (Temporal LSTM / GRU)

- **Input Sequence**: Fixed sliding window of $T=30$ frames (~1.0s at 30fps).
- **Sequence Preprocessing**:
  - Sliding window buffer maintained in memory.
  - Linear temporal interpolation for sequences shorter than $T$ during fast signing.
- **Model Architecture**:
  ```python
  class TemporalGestureRNN(nn.Module):
      def __init__(self, input_size=126, hidden_size=128, num_layers=2, num_classes=15):
          super().__init__()
          self.lstm = nn.LSTM(input_size, hidden_size, num_layers, 
                              batch_first=True, dropout=0.2, bidirectional=True)
          self.fc = nn.Sequential(
              nn.Linear(hidden_size * 2, 64),
              nn.ReLU(),
              nn.Dropout(0.2),
              nn.Linear(64, num_classes)
          )
  ```
- **Target ISL Vocabulary**:
  - `HELLO`, `GOODBYE`, `THANK_YOU`, `HELP`, `PLEASE`, `SORRY`.
- **Temporal Output Smoothing**:
  - Rolling window majority vote with minimum hysteresis threshold (e.g., 5 consecutive identical predictions) to eliminate flicker and duplicate tokens.

---

## 4. Model Training Workflow

```bash
# 1. Capture training landmark sequences
python ml/capture_data.py --label HELLO --samples 30

# 2. Extract and normalize landmarks into training sets
python ml/build_dataset.py

# 3. Train the static Random Forest baseline
python ml/train_static.py

# 4. Train the PyTorch temporal LSTM model
python ml/train_temporal.py --epochs 40 --device mps

# 5. Evaluate models and produce confusion matrix and report
python ml/evaluate.py
```
