# Contributing to SignBridge 🤟
### Building Accessible, Local-First, Multimodal Indian Sign Language AI

Thank you for your interest in contributing to **SignBridge**! We are committed to fostering an inclusive, welcoming, and open-source engineering community dedicated to breaking communication barriers through privacy-first, multimodal, open-weight AI.

---

## 🌟 Extensibility Architecture

SignBridge is engineered with a modular, plugin-like architecture allowing contributors to independently extend any part of the stack:

1. **Sign Vocabulary**:
   - Add new sign definitions via the UI **Data Studio** or define them in `data/vocabulary/custom_plugins.json`.
   - New signs are automatically validated against `VOCAB_SCHEMA` and loaded into the predictor without modifying core code.
2. **Gesture Datasets**:
   - Collect and contribute 3D landmark arrays using the built-in **Data Studio** (`/api/dataset/sample`).
   - Store sequences in `data/raw/<SIGN_LABEL>/sample_<TIMESTAMP>.json`.
3. **Machine Learning Classifiers**:
   - Add or refine classifiers in `ml/models/` (e.g. Transformers, Graph Neural Networks, or 1D-CNNs).
   - Implement the `predict(X)` and `load(path)` interface.
4. **Landmark Preprocessing**:
   - Extend spatial normalization, bone length invariances, and finger joint angle calculation in `ml/normalize.py`.
5. **Language Model Prompts & Multimodal Reasoning**:
   - Customize Gemma 4 visual reasoning and sentence refinement system prompts in `backend/services/gemma_service.py`.
6. **Frontend Components**:
   - Build accessible React components in `frontend/src/components/` and views in `frontend/src/pages/`.

---

## 🛠️ Local Development Setup

### Prerequisites
- macOS 13+ (Ventura, Sonoma, Sequoia) on Apple Silicon (M1/M2/M3/M4) or Linux x86_64/ARM64.
- Python 3.11+
- Node.js 18+ LTS (`npm 10+`)
- Ollama with Gemma 4:
  ```bash
  ollama run gemma4:e4b
  ollama run gemma4:e2b
  ```

### Step-by-Step Installation
```bash
# 1. Clone repository
git clone https://github.com/your-username/signbridge.git
cd signbridge

# 2. Set up Python virtual environment
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Download MediaPipe Hand Landmarker model
./scripts/download_models.sh

# 4. Install frontend dependencies
cd frontend && npm install && cd ..

# 5. Launch development services
./run.sh
```

---

## 🧪 Automated Testing

Before submitting a Pull Request, verify that all test suites pass:

```bash
# Run backend test suite (Python + PyTorch + FastAPI)
source .venv/bin/activate
PYTHONPATH=. pytest

# Run frontend type-check and production build
cd frontend
npm run build
```

---

## 🤝 Contribution Workflow

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with descriptive, conventional commit messages:
   - `feat(gemma): add temporal attention reasoning prompt`
   - `fix(vision): calibrate wrist origin translation`
   - `docs(model): update model card with latency benchmarks`
3. Push to your fork and submit a Pull Request.
4. Fill out the relevant PR description template detailing your changes.

---

## 📜 Ethical Considerations & ISL Integrity

- **Authenticity**: SignBridge strictly uses verified Indian Sign Language (ISL) gestures aligned with standards published by the **Indian Sign Language Research and Training Centre (ISLRTC)**. Do not submit arbitrary ASL/BSL signs labeled as ISL.
- **Privacy**: Landmark datasets must contain strictly anonymized numerical coordinates ($X, Y, Z$). Never commit raw facial images or video recordings containing identifiable personal information.
- **License**: All contributions are licensed under the **Apache-2.0** license.
