#!/bin/bash
set -e

echo "=========================================="
echo " SignBridge System & Environment Check"
echo "=========================================="

echo -n "Checking OS... "
if [[ "$(uname)" != "Darwin" ]]; then
    echo "WARNING: SignBridge is optimized for macOS."
else
    echo "macOS $(sw_vers -productVersion) ($(uname -m))"
fi

echo -n "Checking Python 3.11... "
if command -v python3.11 >/dev/null 2>&1; then
    echo "$(python3.11 --version)"
elif command -v python3 >/dev/null 2>&1; then
    echo "$(python3 --version)"
else
    echo "FAILED: Python not found!"
    exit 1
fi

echo -n "Checking Node.js & npm... "
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "Node $(node -v), npm $(npm -v)"
else
    echo "FAILED: Node/npm not found!"
    exit 1
fi

echo -n "Checking Ollama... "
if command -v ollama >/dev/null 2>&1; then
    echo "Installed ($(ollama --version 2>&1))"
else
    echo "WARNING: ollama not found in PATH."
fi

echo -n "Checking Ollama Daemon (http://localhost:11434)... "
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "Online"
    echo "Installed Ollama Models:"
    ollama list 2>&1 || true
else
    echo "Offline (Start with 'ollama serve')"
fi

echo -n "Checking Virtualenv (.venv)... "
if [ -d ".venv" ]; then
    echo "Found (.venv)"
    source .venv/bin/activate
    python -c "import torch; print('PyTorch MPS Accelerated:', torch.backends.mps.is_available())"
else
    echo "Not found. Run 'scripts/setup_mac.sh' first."
fi

echo "=========================================="
echo "Environment check complete."
echo "=========================================="
