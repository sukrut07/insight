# SignBridge 2.0 — Dataset Coverage & Research Specification

## 1. Executive Summary

SignBridge 2.0 adopts a **multilingual sign language intelligence architecture** supporting three distinct sign languages:
- **Indian Sign Language (ISL)**
- **British Sign Language (BSL)**
- **American Sign Language (ASL)**

Sign languages are not universal pantomimes or simple word-for-word substitutions of spoken languages. Each possesses independent phonology (handshape, orientation, location, movement, non-manual features), morphology, and syntactic structure.

This document details the datasets, licensing, annotation formats, signer diversity, and split strategies utilized across the three pipelines.

---

## 2. Dataset Strategy by Language

| Language | Primary Research Dataset | Secondary Resource | Annotation Format | Signer Diversity | Recognition Mode | Operational Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ISL** | **ISLTranslate** (ACL 2023) | **INCLUDE Dataset** (HuggingFace) | Video + English Sentences (31k pairs) | Multi-signer, varied backgrounds | Word + Continuous Sentence | **Active / Trained** |
| **BSL** | **SignBSL** (signbsl.com) | **BSL Corpus Project** (DCAL / UCL) | Video clips + gloss + definitions | Multi-region UK signers | 2-Handed Fingerspelling & Core Signs | **Experimental Architecture** |
| **ASL** | **WLASL** (Li et al., 2020) | **MS-ASL** (Microsoft Research) | 2,000 word glosses + JSON bounding boxes | 100+ native YouTube signers | 1-Handed Fingerspelling & WLASL Core | **Experimental Architecture** |

---

## 3. Indian Sign Language (ISL) Datasets

### A. ISLTranslate (ACL 2023)
- **Reference**: *ISLTranslate: A Dataset for Translating Indian Sign Language to English* (Findings of ACL 2023)
- **Scope**: ~31,000 continuous ISL video clips paired with English sentence translations.
- **Linguistic Focus**: Subject-Object-Verb (SOV) structure with non-manual facial cues.
- **Use in SignBridge 2.0**: Benchmarking Gemma 4 E4B translation orchestration from sequence tokens to natural English.
- **Licensing**: Research and academic use as specified by ACL.

### B. INCLUDE Dataset (HuggingFace)
- **Reference**: Sridhar et al., Manoj Kumar et al.
- **Scope**: 263 classes, 4,287 videos across 7 distinct domains recorded with 7 signers under varying illumination and camera distances.
- **Use in SignBridge 2.0**: Training and evaluating static Random Forest (148-dim engineered hand features) and temporal BiLSTM (30-frame sliding window).

---

## 4. British Sign Language (BSL) Datasets

### A. SignBSL Reference Archive
- **Reference**: [signbsl.com](https://www.signbsl.com/)
- **Scope**: Community-curated video dictionary of British Sign Language vocabulary and two-handed fingerspelling.
- **Key Characteristics**:
  - Distinct two-handed manual alphabet: Vowels indicated by touching fingers of non-dominant hand with dominant index finger.
  - Ban on single-handed ASL alphabet substitution.

### B. BSL Corpus Project
- **Organization**: Deafness Cognition and Language Research Centre (DCAL), University College London (UCL).
- **Scope**: Natural conversational signing collected from over 240 deaf signers across the United Kingdom.
- **Licensing & Ethics**: Requires institutional data sharing agreement and ethical consent compliance.

---

## 5. American Sign Language (ASL) Datasets

### A. WLASL (Word-Level American Sign Language)
- **Reference**: Dongxu Li et al., *Word-level Deep Sign Language Recognition from Video: A New Large-scale Dataset and Methods Comparison*, WACV 2020.
- **Scope**: 2,000 ASL words across 21,083 video instances performed by 119 signers.
- **Key Characteristics**:
  - One-handed fingerspelling (A–Z) and one- or two-handed lexical items.
  - Standardized benchmark splits: Train (14,289), Val (4,187), Test (2,607).

---

## 6. Signer-Independent Evaluation Protocols

To avoid **data leakage** and inflated benchmark figures, SignBridge enforces:
1. **Signer Independence**: Signers in the test split are never present in the training split.
2. **Hard-Negative Evaluation**: Testing against visually similar pairs (e.g. `FOOD` vs `WATER`, or `PLEASE` vs `SORRY`) to test fine-grained landmark differentiation.
3. **Calibrated Confidence Thresholds**: Rejecting predictions with calibrated probability $< 0.60$ and assigning `UNKNOWN` rather than forcing incorrect predictions.
4. **Local Privacy**: Landmark extraction runs locally; raw webcam video is never stored or transmitted without explicit, separate consent.
