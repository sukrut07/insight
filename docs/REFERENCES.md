# SignBridge: Official References & Documentation Index

This document catalogues official references, verified links, component purposes, and architecture roles for all core technologies powering **SignBridge** (Local-first AI-Powered Indian Sign Language Recognition).

---

## 1. Local AI & Large Language Models

| Technology | Purpose in SignBridge | Official Link | Setup & Notes |
|:---|:---|:---|:---|
| **Google Gemma** | Open-weight foundation LLM providing sentence refinement, contextual smoothing, and grammar structuring from recognized ISL tokens. | [Gemma Docs](https://ai.google.dev/gemma/docs) | Pretrained model weights deployed purely locally. No cloud inference. |
| **Gemma Cookbook** | Reference implementation patterns for prompting, structured JSON output, and local quantization. | [Gemma Cookbook](https://github.com/google-gemma/cookbook) | Used for designing few-shot structured sentence correction prompts. |
| **Ollama** | High-performance local model runtime running quantized LLMs on macOS with native Apple Silicon MLX/Metal acceleration. | [Ollama Official](https://ollama.com/) | Daemon runs on `http://localhost:11434`. Models: `gemma4:e4b` (Primary), `gemma4:e2b` (Fallback). |
| **Ollama API** | REST API for streaming and non-streaming prompt completions and embeddings. | [Ollama API Spec](https://github.com/ollama/ollama/blob/main/docs/api.md) | Endpoint used: `/api/generate` with strict JSON schemas. |

---

## 2. Computer Vision & Landmark Extraction

| Technology | Purpose in SignBridge | Official Link | Setup & Notes |
|:---|:---|:---|:---|
| **MediaPipe Hand Landmarker** | Detects 21 3D landmarks ($X, Y, Z$) per hand in real-time from webcam frames. Supports dual-hand tracking. | [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker) | Python Tasks API / MediaPipe Solutions; extracts normalized landmark coordinates and handedness. |
| **MediaPipe Gesture Recognizer** | Reference for hand gesture taxonomy, bounding box calculations, and wrist origin normalizations. | [Gesture Recognizer](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer) | Architectural reference for custom sign classifiers. |
| **OpenCV (`opencv-python`)** | Image manipulation, BGR-to-RGB conversion, frame compression/decompression, and skeleton drawing. | [OpenCV 4.x Docs](https://docs.opencv.org/4.x/) | Installed via pip (`opencv-python`). Avoids conflicts with headless versions. |

---

## 3. Machine Learning & Feature Engineering

| Technology | Purpose in SignBridge | Official Link | Setup & Notes |
|:---|:---|:---|:---|
| **PyTorch (`torch`)** | Deep learning framework for temporal gesture recognition (LSTM/GRU) and multi-layer perceptrons (MLP). | [PyTorch Docs](https://pytorch.org/docs/stable/) | Configured with Apple Silicon `mps` acceleration with automatic fallback to `cpu`. |
| **Scikit-learn** | Random Forest baseline classifier for static ISL gestures, evaluation metrics, and cross-validation. | [Scikit-learn](https://scikit-learn.org/stable/) | Metrics: precision, recall, F1-score, confusion matrix. Models serialized via `joblib`. |
| **NumPy & Pandas** | Landmark coordinate normalization, vector arithmetic, joint angle computation, and dataset serialization (`.npy`, `.parquet`). | [NumPy Docs](https://numpy.org/doc/) / [Pandas Docs](https://pandas.pydata.org/docs/) | Pinned to `numpy<2.0.0` for full compatibility with MediaPipe and PyTorch C extensions. |

---

## 4. Backend & Web Services

| Technology | Purpose in SignBridge | Official Link | Setup & Notes |
|:---|:---|:---|:---|
| **FastAPI** | High-performance asynchronous web framework handling WebSocket streaming, REST APIs, and background processing. | [FastAPI Docs](https://fastapi.tiangolo.com/) | Implements non-blocking endpoints, lifespan management, and clean dependency injection. |
| **Uvicorn** | Lightning-fast ASGI server implementation for Python. | [Uvicorn Docs](https://www.uvicorn.org/) | Run with `uvicorn backend.main:app --host 127.0.0.1 --port 8000`. |
| **Pydantic & Settings** | Data validation, request/response models, and environment settings. | [Pydantic Docs](https://docs.pydantic.dev/latest/) | Strict type validation for landmark coordinates and API schemas. |
| **SQLite** | Embedded local database for user feedback, correction queues, and translation history. | [SQLite Docs](https://sqlite.org/) | Offline storage located in `data/signbridge.db`. |

---

## 5. Frontend & UI Engineering

| Technology | Purpose in SignBridge | Official Link | Setup & Notes |
|:---|:---|:---|:---|
| **React** | Component-driven UI for webcam display, live translation feedback, model monitoring, and dataset recording. | [React Docs](https://react.dev/) | React 18/19 with TypeScript strict mode. |
| **Vite** | Modern, instantaneous frontend build tool and development server. | [Vite Guide](https://vite.dev/guide/) | Configured with proxy to FastAPI backend (`/api` and `/ws`). |
| **Tailwind CSS** | Utility-first CSS framework for crafting a dark-mode-first aesthetic. | [Tailwind CSS Docs](https://tailwindcss.com/docs) | Custom palette: deep navy, slate gray, emerald accents, and subtle borders. |
| **Lucide React** | Lightweight, clear SVG icons for accessibility, hardware status, and UI controls. | [Lucide React](https://lucide.dev/) | Consistent stroke width and accessible labels. |
| **Zustand** | Minimalist state store for live recognition buffers, translation history, and system settings. | [Zustand Docs](https://zustand.docs.pmnd.rs/) | Low-overhead reactive state. |

---

## 6. Indian Sign Language (ISL) Ground Truth

| Resource | Purpose in SignBridge | Official Link |
|:---|:---|:---|
| **Indian Sign Language Research and Training Centre (ISLRTC)** | Autonomous body under the Ministry of Social Justice and Empowerment, Government of India. Authoritative standard for authentic ISL vocabulary, 2-hand gestures, and grammar structure. | [ISLRTC Official Portal](https://www.islrtc.nic.in/) |

*Note: SignBridge strictly uses verified ISL gestures (both single-handed and double-handed gestures) and does not map arbitrary Western ASL signs as ISL.*
