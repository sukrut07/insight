# SignBridge Dataset Guide & ISL Data Collection

This document defines the dataset structure, verified Indian Sign Language (ISL) vocabulary, collection guidelines, and data hygiene rules for SignBridge.

---

## 1. Directory Layout

All landmark data, vocabulary configurations, and user correction buffers reside in `data/`:

```
data/
├── raw/               # Uncompressed landmark captures per session (.json / .npy)
├── processed/         # Normalized feature vectors ready for ML modeling
├── train/             # Split training dataset (80%)
├── validation/        # Split validation dataset (10%)
├── test/              # Split test dataset (10%)
├── feedback/          # User-corrected gesture samples awaiting review
└── vocabulary/
    └── isl_vocabulary.json # Verified dictionary configuration
```

---

## 2. Verified Core Vocabulary (ISL Ground Truth)

SignBridge starts with 15 verified Indian Sign Language gestures as established by the Indian Sign Language Research and Training Centre (ISLRTC):

| Token | Gesture Type | Description | Dominant Hands |
|:---|:---|:---|:---|
| **HELLO** | Dynamic | Open palm placed near forehead/temple and moved outward in a salute-like gentle greeting arc. | Single (Right) |
| **GOODBYE** | Dynamic | Open hand oscillating gently side to side at chest height. | Single |
| **THANK_YOU** | Dynamic | Flat hand touching chin/lips, then extending forward toward the recipient. | Single |
| **PLEASE** | Dynamic | Flat palm circular rubbing motion over chest/heart. | Single |
| **SORRY** | Dynamic | Closed fist rotating in a gentle circular motion over the chest. | Single |
| **HELP** | Dynamic | Left flat palm facing upward; Right closed fist (thumbs-up configuration) placed on left palm and lifted upward together. | Double-handed |
| **YES** | Static | Fist nodding vertically downward like a head nod. | Single |
| **NO** | Static | Index and middle fingers tapping against the thumb rapidly. | Single |
| **WATER** | Static / Dynamic | "W" hand shape (index, middle, ring extended) brought to touch the side of the chin/lips. | Single |
| **FOOD** | Dynamic | Flattened O-shape hand (fingertips touching thumb) brought repeatedly toward mouth. | Single |
| **I** | Static | Index finger pointing directly to the center of the chest. | Single |
| **YOU** | Static | Index finger pointing forward toward the conversational partner / camera. | Single |
| **MY** | Static | Open flat hand placed against the center of the chest. | Single |
| **WHAT** | Dynamic | Both open hands held forward, palms up, shaking slightly outward. | Double-handed |
| **WHERE** | Dynamic | Index finger extended pointing upward, wagging side to side. | Single |

---

## 3. Dataset Collection Guidelines

To prevent dataset contamination and preserve model generalization:
1. **Separate Signers**: Never mix frames from the exact same recording session across train and test splits.
2. **Lighting and Distance Invariance**: Record signs at varying distances (0.5m to 1.5m) and lighting conditions.
3. **Padded Boundaries**: Discard the first 3 frames and last 3 frames of each recording to eliminate transition artifacts when the user starts/stops recording.
4. **Authenticity Guarantee**: Never invent arbitrary hand gestures and assign them ISL labels. Every supported sign must reflect standard ISL grammar.
