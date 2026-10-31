# SignBridge Installation and Setup Guide

This guide details the complete local setup of SignBridge on macOS (optimized for Apple Silicon M1/M2/M3/M4).

---

## 1. Prerequisites Checklist

Ensure the following tools are present on your machine:
- **macOS**: 13.0 (Ventura) or later (Tested on macOS 15 Sonoma/Sequoia)
- **Homebrew**: Package manager (`brew --version`)
- **Git**: Version control (`git --version`)
- **Python**: Version 3.11 (`python3.11 --version`)
- **Node.js**: Version 18+ LTS (`node --version`)
- **Ollama**: Local LLM engine (`ollama --version`)

If Homebrew or Python 3.11 is missing:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python@3.11 node git ollama
```

---

## 2. Python Environment Setup

SignBridge enforces an isolated virtual environment to avoid global namespace pollution:

```bash
# 1. Create a dedicated Python 3.11 virtualenv
python3.11 -m venv .venv

# 2. Activate the virtual environment
source .venv/bin/activate

# 3. Upgrade pip
pip install --upgrade pip

# 4. Install backend dependencies
pip install -r requirements.txt
```

### Apple Silicon PyTorch MPS Verification
Run this command within your activated `.venv` to verify Metal Performance Shaders (MPS) hardware acceleration:
```bash
python -c "import torch; print('MPS Available:', torch.backends.mps.is_available())"
```

---

## 3. Ollama & Gemma Setup

1. Start the Ollama background daemon:
   ```bash
   ollama serve
   ```
2. Pull the required models:
   ```bash
   # Primary Model (~9.5 GB)
   ollama pull gemma4:e4b

   # Fallback Model (~7.5 GB)
   ollama pull gemma4:e2b
   ```
3. Test inference:
   ```bash
   ollama run gemma4:e4b "Hello! Confirm you are working."
   ```

---

## 4. Frontend Setup

The frontend is a Vite + React + TypeScript + Tailwind CSS application located in the `frontend/` directory.

```bash
cd frontend
npm install
npm run build
```

---

## 5. Running the Complete System

SignBridge provides a unified orchestrator script that verifies the environment, checks models, and launches both services:

```bash
chmod +x run.sh
./run.sh
```

- **Frontend Interface**: `http://localhost:5173`
- **FastAPI Documentation**: `http://localhost:8000/docs`
- **WebSocket Gateway**: `ws://localhost:8000/ws/recognition`
