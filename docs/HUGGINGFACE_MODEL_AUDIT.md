# iNSIGHT — Hugging Face Model & Dataset Audit

## Multilingual Sign Language Recognition & Translation Architecture

> **Date**: October 2026  
> **Status**: Approved Architectural Evaluation  
> **Target Languages**: Indian Sign Language (ISL), British Sign Language (BSL), American Sign Language (ASL)  
> **Principle**: *Language-Specific Model Ensembles over Monolithic Multilingual Replacement*

---

## 1. Executive Summary & Core Principle

Pretrained machine learning models for sign language are **not interchangeable drop-in translators**. Sign languages are natural human languages with distinct lexicons, phonologies, and spatial-temporal grammars:
* **ISL (Indian Sign Language)**: Predominantly Subject-Object-Verb (SOV) grammatical structure with two-handed manual fingerspelling and rich non-manual markers.
* **BSL (British Sign Language)**: Topic-Comment structure using a distinct two-handed fingerspelling alphabet.
* **ASL (American Sign Language)**: Topic-Comment / SVO structure utilizing a one-handed fingerspelling system descended from Old French Sign Language.

A single unified model cannot simply have its language tag switched. Furthermore, models on Hugging Face address fundamentally different granularities:
1. **Alphabet Fingerspelling Classifiers** (static single-frame image classification, e.g. A–Z).
2. **Isolated Word Recognizers** (fixed-length video clips or landmark windows classifying bounded vocabulary).
3. **Continuous Sign Language Recognizers (CSLR)** (temporal sequence-to-gloss alignment using CTC, TCN, or Transformers).
4. **Sign-to-Text Translators (SLTT)** (direct end-to-end video/pose to spoken language text).

### Architectural Recommendation
iNSIGHT adopts a **Language-Specific Model Ensemble** architecture:
* A **Shared Preprocessing Layer** (MediaPipe Holistic extracting hands, face, and upper-body pose).
* A **Language Router** selecting independent language recognizers with dedicated weights and vocabularies.
* A **Dual Pipeline Strategy**:
  * **Path A (Modular)**: Hand/Holistic landmarks $\to$ Temporal Segmentation $\to$ Gloss Sequence $\to$ Gemma 4 / Ollama Linguistic Refinement.
  * **Path B (Direct Sequence)**: Continuous landmark stream $\to$ Sequence-to-text encoder-decoder (DeepMind SL2T / Sanket benchmark).

---

## 2. Comprehensive Hugging Face Model Comparison Matrix

| Model Identifier | Target Lang | Primary Task | Model Architecture | Input Modality & Shape | Checkpoint / Size | Vocab Classes | License | Evaluation Claim | iNSIGHT Integration Role |
|---|---|---|---|---|---|---|---|---|---|
| **`Abs6187/isl-models`** | ISL | Dynamic Sign Recognition | Hierarchical Two-Stream Transformer | Dual-stream: 154-dim pose/hand landmarks + RGB frames | PyTorch (`.pt`), ~180 MB | 80+ ISL signs | MIT | 94.6% accuracy on 2,000+ clips | **Primary ISL Dynamic Candidate** (benchmark against BiLSTM) |
| **`ayush2635/sanket-isl-translator`** | ISL | Video-to-Text Translation | Dual-stream Gated Multimodal TimeSformer | RGB video sequences (16 frames, $224 \times 224$) | PyTorch (`.pth`), ~420 MB | Continuous English sentence output | Apache-2.0 | Peak BLEU-1: 50.6% | **Path B Translation Benchmark** (compare with Gemma 4) |
| **`kirandevraj/ISL-Fingerspelling`** | ISL | Fingerspelling Recognition | ResNet-18 + 2-layer BiLSTM + CTC | RGB frames ($224 \times 224 \times 3$), variable length | PyTorch (`.pt`), ~85 MB | 28 classes (Blank, Space, A–Z) | CC-BY-NC-4.0 | Signer-independent CER: 7.2% | **Specialized ISL Fingerspelling Engine** |
| **`Hemgg/sign-language-classification`** | ISL | Static Image Classification | Fine-tuned Vision Transformer (ViT-Base) | Single RGB image ($224 \times 224 \times 3$) | Hugging Face Transformers, ~340 MB | 36 classes (A–Z, 0–9) | MIT | 99.05% (2 epochs, train leakage risk) | **Limited Baseline Only** (static fingerspelling, not continuous) |
| **`SharoonArshad/asl-citizen-bigru-attention-encoder-200`** | ASL | Dynamic Vocabulary Recognition | Bidirectional GRU + Attention Pooling | 30-frame sequence of 2D/3D pose keypoints | PyTorch (`.pt`), ~45 MB | 200 ASL Citizen classes | CC-BY-NC-SA 4.0 | 88.4% Top-1, 95.1% Top-5 | **Primary ASL Dynamic Candidate** |
| **`SharoonArshad/asl-citizen-small-transformer-encoder-200`** | ASL | Dynamic Vocabulary Recognition | Transformer Video Encoder | 30-frame keypoint sequence ($T=30, D=135$) | PyTorch (`.pt`), ~62 MB | 200 ASL Citizen classes | CC-BY-NC-SA 4.0 | 89.2% Top-1, 95.7% Top-5 | **Secondary ASL Sequence Benchmark** |
| **`abdollahhh/asl-sign-language-efficientnet-b0`** | ASL | Alphabet Fingerspelling | EfficientNet-B0 CNN | Single RGB image ($224 \times 224 \times 3$) | PyTorch / ONNX, ~16 MB | 26 ASL letters (A–Z) | Apache-2.0 | 99.02% Top-1 | **Lightweight ASL Fingerspelling Engine** |
| **`nocontextdoruk/asl-landmark-mlp`** | ASL | Landmark Classification | Multi-Layer Perceptron (MLP) | Single-frame normalized landmarks (63-dim) | PyTorch / Joblib, ~4 MB | 24 static signs | MIT | 92.4% validation | **Low-latency static ASL baseline** |
| **`signon-project/slr-poseformer-bsl`** | BSL | Keypoint Sign Recognition | PoseFormer (Spatial-Temporal Transformer) | Continuous 3D skeletal keypoint sequence | PyTorch checkpoint, ~110 MB | BSL lexicon subset | European Union Horizon 2020 / Open | Research prototype | **Primary BSL Pose Recognition Candidate** |

---

## 3. Deep-Dive Candidate Evaluations

### 3.1 Indian Sign Language (ISL) Candidates

#### Candidate 1: `Abs6187/isl-models`
* **Architecture**: Hierarchical Two-Stream Transformer. The spatial stream processes MediaPipe holistic keypoints (154 coordinates: 21 landmarks $\times$ 3 per hand + 25 pose landmarks); the temporal stream cross-attends visual appearance with landmark velocity vectors.
* **Compatibility with iNSIGHT**: High. iNSIGHT's canonical 148-dimensional feature extractor can be mapped directly to the spatial input stream with an adapter matrix ($148 \to 154$).
* **Licensing & Ethics**: MIT license permits commercial and open-source integration.
* **Risk / Limitation**: Requires GPU or Apple Silicon MPS for real-time 30 FPS inference. On CPU, latency hovers around 45–60 ms.

#### Candidate 2: `ayush2635/sanket-isl-translator`
* **Architecture**: Dual-stream gated multimodal Transformer built upon TimeSformer. Unlike token-based recognizers, it directly decodes continuous video frames into natural English text strings.
* **Role in iNSIGHT**: Direct sequence-to-text benchmark against Google DeepMind's SL2T architecture and iNSIGHT's modular Path A (Landmarks $\to$ Gloss $\to$ Gemma 4).
* **Licensing**: Apache-2.0.
* **Risk / Limitation**: Memory footprint (~420 MB checkpoint). Video frame batching requires buffering 16 full RGB frames, introducing a ~530 ms latency floor.

#### Candidate 3: `kirandevraj/ISL-Fingerspelling`
* **Architecture**: ResNet-18 convolutional backbone extracting frame-level visual embeddings, fed to a 2-layer BiLSTM with Connectionist Temporal Classification (CTC) loss.
* **Role in iNSIGHT**: Solves spelling of proper nouns, names, and loan words that are not part of standard ISL vocabulary dictionaries.
* **Licensing**: CC-BY-NC-4.0 (strictly non-commercial research use; requires attribution).

---

### 3.2 American Sign Language (ASL) Candidates

#### Candidate 1: `SharoonArshad/asl-citizen-bigru-attention-encoder-200`
* **Architecture**: BiGRU with additive attention pooling trained on the landmark sequences of the **ASL Citizen** dataset (the largest crowd-sourced, Deaf-signer curated ASL dataset).
* **Input**: 30-frame sequence of normalized body and hand keypoints.
* **Role in iNSIGHT**: Ideal backbone for expanding ASL from experimental state into verified vocabulary recognition for 200 common conversational signs.
* **Licensing**: CC-BY-NC-SA 4.0.

#### Candidate 2: `abdollahhh/asl-sign-language-efficientnet-b0`
* **Architecture**: Lightweight EfficientNet-B0 (4M parameters) evaluating single 2D camera frames.
* **Role in iNSIGHT**: Ultra-fast (3.8 ms latency) alphabet spelling assistant for ASL fingerspelling practice in the Learning Centre.
* **Licensing**: Apache-2.0.

---

### 3.3 British Sign Language (BSL) Candidate

#### Candidate: `signon-project/slr-poseformer-bsl`
* **Architecture**: PoseFormer spatial-temporal self-attention network developed as part of the European Commission's Horizon 2020 SignON research consortium.
* **Importance**: BSL has historically lacked open-weight recognition models on public registries. This is the first verified BSL pose checkpoint available for public research benchmarking.
* **Linguistic Grounding**: Strictly tuned for British Sign Language two-handed manual articulators and regional BSL variations.
* **Role in iNSIGHT**: Establishes the real baseline for BSL recognition, replacing placeholder mocks with authentic keypoint models.

---

## 4. Dataset Evaluation & Provenance Strategy

| Dataset Identifier | Language | Modality | Samples & Volume | Signers | License | iNSIGHT Usage Strategy |
|---|---|---|---|---|---|---|
| **`ISL500/ISL-DATA`** | ISL | Video + MediaPipe Landmarks | 7,500 clips, 500 signs | 15 signers | Academic / Research | Fine-tuning canonical 148-dim ISL temporal model |
| **`vidit031/isl-isolated-40words`** | ISL | Video clips | 642 clips, 40 vocabulary words | Multi-signer | Review flags noted | Validation benchmark for confusing sign pairs |
| **`pedroodb/glosl-how2sign`** | ASL | Continuous Video + Text + Pose | 34,305 samples, 61.15 hours | Held-out video splits | CC-BY-NC-4.0 | Continuous sequence translation research |
| **`CLERC-DATA/epee`** | ASL | 128 motion keypoints + Gloss | 2,400 clips | 8 Deaf signers | CC-BY-NC-SA 4.0 | Holistic upper-body pose evaluation |
| **`SignerX/SignVerse-2M`** | Multilingual (55 langs) | DWPose 133 Keypoints | 2,000,000 clips | Thousands | CC-BY-NC-4.0 | Large-scale pretraining reference |

### Data Ethics & Leakage Prevention Rules
1. **Signer-Independent Splitting**: Datasets are never split by shuffling frames or video segments. Entire signer IDs are held out strictly for validation and testing ($K$-fold cross-validation by signer).
2. **Explicit Consent & Non-Commercial Observance**: Any dataset with `NC` restrictions (e.g. `iSign`, `How2Sign`, `SignVerse-2M`) is isolated in academic/evaluation scripts and excluded from commercial production packaging.
3. **No Automatic Scraping**: User camera frames are never saved to dataset directories without an affirmative user opt-in record in `data/consent_records.json`.

---

## 5. Architectural Implementation: Abstract `SignLanguageRecognizer`

To support pluggable Hugging Face candidates without rewriting backend services or UI components, iNSIGHT establishes a formal model adapter interface:

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np

class SignLanguageRecognizer(ABC):
    """Abstract model interface implemented by all language-specific recognition engines."""

    @abstractmethod
    def load(self, checkpoint_path: Optional[str] = None) -> bool:
        """Loads weights, validates metadata, and checks input dimension compatibility."""
        pass

    @abstractmethod
    def predict_frame(
        self,
        detected_hands: List[Dict[str, Any]],
        holistic_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Performs single-frame or rolling temporal inference."""
        pass

    @abstractmethod
    def get_vocabulary(self) -> List[Dict[str, Any]]:
        """Returns verified vocabulary metadata for this language."""
        pass

    @abstractmethod
    def get_model_metadata(self) -> Dict[str, Any]:
        """Returns model version, architecture, parameter count, and evaluation metrics."""
        pass

    @abstractmethod
    def reset(self) -> None:
        """Clears temporal sequence and hidden buffers."""
        pass
```

### Language Router & Registry Flow
```
Camera Frame ──▶ MediaPipe Holistic ──▶ Canonical 148-dim Feature Extractor
                                                       │
                                      Language Router (Session-Scoped)
                                     ┌─────────────────┼─────────────────┐
                                     ▼                 ▼                 ▼
                              ISL Recognizer    BSL Recognizer    ASL Recognizer
                              (RF + BiLSTM)      (PoseFormer)      (BiGRU / MLP)
                                     │                 │                 │
                                     └─────────────────┼─────────────────┘
                                                       ▼
                                      Confidence Calibration & OOD Gate
                                      (P < 0.65 ──▶ Mark as UNKNOWN)
                                                       ▼
                                      Structured Gloss Sequence Buffer
                                                       ▼
                                    Gemma 4 E4B Multimodal Decision Gate
                                    (Corroborated ──▶ VERIFIED, Disputed ──▶ DISPUTED)
                                                       ▼
                                      Natural English Spoken Translation
```

---

## 6. Actionable Integration Roadmap

1. **Phase 1 (Immediate)**: Implement `ml/recognizer_interface.py` and `ml/model_registry.py` formalizing `SignLanguageRecognizer`.
2. **Phase 2 (Candidate Adapters)**:
   - Provide concrete adapters for ISL (BiLSTM + RF), ASL (ASL-Citizen BiGRU adapter specification), and BSL (PoseFormer adapter specification).
   - Wire `GestureService` and `SessionManager` to query the registry dynamically.
3. **Phase 3 (Fingerspelling Expansion)**: Add secondary fingerspelling heads (`ISL-Fingerspelling` CTC and `EfficientNet-B0`) activated when fingerspelling mode is selected in the Learning Centre.
4. **Phase 4 (Continuous Benchmark)**: Benchmark candidate continuous translation models against held-out ISLTranslate samples.
