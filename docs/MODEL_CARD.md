# SignBridge Model Card 📇
### Comprehensive AI Subsystems Specification (MediaPipe • ML Classifiers • Gemma 4)

---

## 1. Subsystem Overview

SignBridge employs a modular three-layer architecture combining computer vision, specialized machine learning classifiers, and open-weight foundation models:

| Subsystem | Architecture | Weights / Size | Role & Capabilities |
|:---|:---|:---|:---|
| **Layer 1 Vision** | Google MediaPipe Hand Landmarker | `hand_landmarker.task` (7.5 MB Float16) | Dual-hand 3D tracking (21 points/hand, 42 total). Extracts spatial coordinates and handedness. |
| **Layer 1 ML (Static)** | Random Forest Classifier | `static_rf.joblib` (1.2 MB) | Instant single-frame pose classification (148 engineered normalized features). Poses: *YES, NO, WATER, I, YOU, MY*. |
| **Layer 1 ML (Temporal)**| Bidirectional LSTM with Attention | `temporal_lstm.pt` (450 KB) | 30-frame sliding window dynamic motion gesture classification. Signs: *HELLO, GOODBYE, THANK_YOU, PLEASE, SORRY, HELP, FOOD, WHAT, WHERE*. |
| **Layer 2 & 3 Intelligence**| Google Gemma 4 E4B (Primary) | `gemma4:e4b` via Ollama (9.5 GB) | Multimodal visual reasoning, discrepancy detection, and contextual SOV-to-SVO English sentence refinement. |
| **Fallback Intelligence** | Google Gemma 4 E2B (Fallback) | `gemma4:e2b` via Ollama (7.5 GB) | Lightweight grammar refinement engine when host unified memory is constrained. |
| **Prototype Cloud Mode** | Google Gemma API | `gemma-4-31b-it` / `gemma-4-26b-a4b-it` | Optional rapid-prototyping provider via Google AI Studio API (requires explicit user opt-in and consent). |

---

## 2. Intended Use & Domain Boundaries

### Intended Use
- Assisting real-time face-to-face communication between native Indian Sign Language (ISL) users and hearing individuals.
- Educational exploration of authentic ISL gestures as standardized by the **Indian Sign Language Research and Training Centre (ISLRTC)**.
- Research in multimodal verification: using open-weight LLMs (Gemma 4) to cross-evaluate computer vision classifications.

### Out-of-Scope & Misuse
- Not certified for medical emergency triage or legal testimony translation without qualified human interpreters.
- Not intended for Western ASL or BSL vocabularies without loading regional vocabulary plugin packs.

---

## 3. Training & Quantitative Evaluation

### Data Splits & Normalization
- **Feature Vector**: 148 dimensions (126 normalized coordinates + 20 finger joint angles + 2 dual-hand distance/scale metrics).
- **Split Protocol**: Signer-independent 80/20 train/test split across recorded ISL sessions.
- **Normalization**: Origin anchored to wrist (landmark 0), scale normalized by palm span ($||p_0 - p_9||_2$).

### Measured Test Metrics (Held-Out Test Set)

```
========================================================================
Architecture               Samples   Accuracy   Precision   Recall   F1-Score   Latency
------------------------------------------------------------------------
Static Random Forest           150      97.3%       0.974    0.973      0.973    1.8 ms
Temporal Bi-LSTM (30-frame)    180      95.6%       0.958    0.956      0.956   14.2 ms
Gemma 4 Multimodal Visual      100      96.0%*      0.950    0.960      0.955   42.0 ms
========================================================================
* Measured consistency rate with verified ground-truth gestures.
```

---

## 4. Ethical Considerations, Fairness & Limitations

- **Skin Tone and Lighting Invariance**: MediaPipe Hand Landmarker relies on geometric coordinate extraction rather than raw RGB color segmentation, improving robustness across varying skin tones and diverse lighting.
- **Occlusion Resilience**: When one hand is occluded or absent, the pipeline automatically detects `left_hand_present` and `right_hand_present` and applies single-hand fallback processing.
- **Ground Truth Grounding**: Gemma 4 is strictly instructed **never to invent or hallucinate** unverified ISL sign definitions. When discrepancies occur, predictions are held for human review.
