#!/bin/bash
set -e

echo "=== SignBridge Model Downloader ==="

# 1. Download MediaPipe Hand Landmarker model if not present
mkdir -p models/gesture
if [ ! -f "models/gesture/hand_landmarker.task" ]; then
    echo "Downloading MediaPipe Hand Landmarker model..."
    curl -L -o models/gesture/hand_landmarker.task https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
    echo "MediaPipe task model saved to models/gesture/hand_landmarker.task"
else
    echo "MediaPipe Hand Landmarker model already exists."
fi

# 2. Check Ollama Gemma Models
if command -v ollama >/dev/null 2>&1; then
    echo "Checking local Gemma models in Ollama..."
    if ! ollama list | grep -q "gemma4:e4b"; then
        echo "Pulling primary model (gemma4:e4b)..."
        ollama pull gemma4:e4b
    else
        echo "Primary model (gemma4:e4b) is already available."
    fi

    if ! ollama list | grep -q "gemma4:e2b"; then
        echo "Pulling fallback model (gemma4:e2b)..."
        ollama pull gemma4:e2b
    else
        echo "Fallback model (gemma4:e2b) is already available."
    fi
else
    echo "Ollama not installed or not in PATH. Please install Ollama from https://ollama.com/"
fi

echo "All required models verified."
