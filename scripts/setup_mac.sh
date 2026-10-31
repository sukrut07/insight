#!/bin/bash
set -e

echo "=========================================="
echo " SignBridge macOS First-Time Setup"
echo "=========================================="

# 1. Create Python Virtual Environment
if [ ! -d ".venv" ]; then
    echo "Creating Python 3.11 virtual environment in .venv..."
    if command -v python3.11 >/dev/null 2>&1; then
        python3.11 -m venv .venv
    else
        python3 -m venv .venv
    fi
fi

# 2. Activate and Install Backend Requirements
source .venv/bin/activate
echo "Upgrading pip and installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 3. Download Models
bash scripts/download_models.sh

# 4. Install Frontend Dependencies
if [ -d "frontend" ]; then
    echo "Installing frontend npm packages..."
    cd frontend
    npm install
    cd ..
fi

echo "=========================================="
echo " Setup complete! Run ./run.sh to start."
echo "=========================================="
