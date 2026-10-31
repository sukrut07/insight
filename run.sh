#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================================="
echo "          SignBridge: Starting Local AI System            "
echo "=========================================================="

# 1. Environment & Dependency Check
if [ ! -d ".venv" ]; then
    echo "Virtual environment (.venv) not found."
    echo "Running first-time setup via scripts/setup_mac.sh..."
    bash scripts/setup_mac.sh
fi

source .venv/bin/activate
export PYTHONPATH=.

# 2. Check Ollama Status
echo -n "Checking Ollama daemon... "
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "Online (http://localhost:11434)"
else
    echo "Warning: Ollama daemon is offline."
    echo "Starting Ollama service in background..."
    if command -v ollama >/dev/null 2>&1; then
        ollama serve >/dev/null 2>&1 &
        sleep 2
    else
        echo "Ollama is not installed. Application will run in offline pass-through mode."
    fi
fi

# 3. Check Models
if [ ! -f "models/gesture/hand_landmarker.task" ]; then
    echo "MediaPipe task model missing. Downloading..."
    bash scripts/download_models.sh
fi

if [ ! -f "models/gesture/temporal_lstm.pt" ] || [ ! -f "models/gesture/static_rf.joblib" ]; then
    echo "Gesture model checkpoints missing. Training baseline models..."
    python ml/train_static.py --model-type rf
    python ml/train_temporal.py --rnn-type lstm --epochs 25
    python ml/evaluate.py
fi

# 4. Handle Clean Termination on CTRL+C
cleanup() {
    echo ""
    echo "Shutting down SignBridge servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

# 5. Start Backend Process
echo "Launching FastAPI Backend (Uvicorn)..."
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --log-level info &
BACKEND_PID=$!

# Wait for backend to be ready
echo -n "Waiting for backend readiness..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
        echo " Ready!"
        break
    fi
    sleep 0.5
done

# 6. Start Frontend Process
echo "Launching Vite Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!
cd ..

echo "=========================================================="
echo "  SignBridge is running locally on macOS!"
echo "  - Web Application:   http://localhost:5173"
echo "  - FastAPI Docs:      http://127.0.0.1:8000/docs"
echo "  - WebSocket Stream:  ws://127.0.0.1:8000/ws/recognition"
echo "  - Ollama Engine:     http://localhost:11434"
echo "=========================================================="
echo "Press CTRL+C at any time to stop all services."

# Keep parent script running
wait
