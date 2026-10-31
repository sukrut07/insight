# SignBridge Dataset Card 📊
### ISL Core Landmark Dataset (MediaPipe 3D Landmark Representation)

---

## 1. Dataset Summary

The **SignBridge ISL Landmark Dataset** is an open-source, anonymized geometric landmark dataset designed for training and evaluating Indian Sign Language (ISL) gesture recognition models.

- **Standard Alignment**: Formulated in accordance with published standards by the **Indian Sign Language Research and Training Centre (ISLRTC)**.
- **Classes**: 15 Verified Core Signs (expandable via the plugin system):
  - *Dynamic*: `HELLO`, `GOODBYE`, `THANK_YOU`, `PLEASE`, `SORRY`, `HELP`, `FOOD`, `WHAT`, `WHERE`.
  - *Static*: `YES`, `NO`, `WATER`, `I`, `YOU`, `MY`.
- **Modality**: 42 3D spatial landmark coordinates ($X, Y, Z$) representing dual hands (21 points/hand).

---

## 2. Landmark Structure & Normalization Protocol

Each recorded sample consists of continuous 30-frame temporal sequences (at 25 FPS) or static single-frame poses:

```
Frame Vector (148 dimensions):
[0 .. 62]    : Left Hand Normalized Landmarks (21 points × [x, y, z])
[63 .. 125]  : Right Hand Normalized Landmarks (21 points × [x, y, z])
[126 .. 135] : Left Hand Finger Joint Angles (10 flexions)
[136 .. 145] : Right Hand Finger Joint Angles (10 flexions)
[146]        : Inter-wrist Euclidean distance
[147]        : Dual-hand scale factor
```

### Coordinate Invariance
1. **Wrist Origin Centering**: Every coordinate point $p_i$ is translated such that the wrist ($p_0$) sits at $(0, 0, 0)$:
   $$p_i' = p_i - p_0$$
2. **Scale Invariance**: Divided by the Euclidean distance between the wrist and Middle Finger MCP joint ($p_9$):
   $$p_i'' = \frac{p_i'}{||p_9' - p_0'||_2}$$

---

## 3. Privacy, Anonymity & Ethical Safeguards

- **Zero Facial Data**: The dataset consists exclusively of anonymized floating-point spatial coordinate vectors. No RGB images or video streams showing human faces, backgrounds, or identifiable personal attributes are stored.
- **Signer Diversity**: Collected across multiple signers to prevent signer-specific overfitting.
- **Licensing**: Released under the **Apache-2.0** open-source license.

---

## 4. Dataset Collection & Extension

Contributors can collect new landmark samples directly through the application's **Data Studio** (`http://localhost:5173`) or programmatically:

```bash
# Capture raw landmark samples for a specific sign
source .venv/bin/activate
python -m ml.capture_data --sign NAMASTE --samples 50

# Rebuild normalized numpy arrays and train/test splits
python -m ml.build_dataset
```
