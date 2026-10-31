#!/bin/bash
set -e

# Change to project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ ! -d ".venv" ]; then
    echo "Virtualenv not found. Please run scripts/setup_mac.sh first."
    exit 1
fi

source .venv/bin/activate
export PYTHONPATH=.

echo "Starting SignBridge FastAPI backend on http://127.0.0.1:8000 ..."
exec uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
