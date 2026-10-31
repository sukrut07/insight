# iNSIGHT — Docker & Containerization Deployment Guide 🐳
**Date**: October 31, 2026  
**Status**: Multi-stage Dockerfile & Compose Schema Standardized

---

## 1. Overview & Architecture

iNSIGHT features an optimized multi-stage container deployment architecture:

```
[Stage 1: node:18-alpine]
   └─ Build React 18 / Vite SPA → /app/frontend/dist

[Stage 2: python:3.11-slim]
   ├─ System dependencies (libgl1, libglib2.0-0, curl)
   ├─ Python wheel installation (PyTorch, MediaPipe, FastAPI)
   ├─ Non-root security user (appuser, UID 1000)
   ├─ Static SPA assets copy → /app/frontend/dist
   └─ Unified FastAPI runtime (Port 8000) serving API + SPA
```

---

## 2. Ollama Integration Topology

When running iNSIGHT inside a Docker container, it can connect to Ollama in two distinct modes:

### Mode A: Host Machine Ollama (Recommended for Apple Silicon / Dedicated GPUs)
This configuration allows the containerized backend to leverage the host's native GPU/Neural Engine acceleration (e.g., Apple Silicon MLX runner):
- In `docker-compose.yml`, `extra_hosts` maps `host.docker.internal:host-gateway`.
- Backend connects to `http://host.docker.internal:11434`.
- Host must have `OLLAMA_HOST=0.0.0.0` or allow incoming localhost connections.

### Mode B: Containerized Ollama (Complete Isolation / Cloud VM)
For Linux virtual machines or cloud servers without existing host Ollama:
```bash
docker compose --profile with-ollama up -d --build
```
This launches a companion `ollama/ollama:latest` container with persistent model volume `ollama_models`.

---

## 3. Quickstart Commands

### 1. Build and Start Application
```bash
# Start backend and web interface connecting to host Ollama
docker compose up -d --build

# Verify container health
docker compose ps
curl http://localhost:8000/api/health
```

### 2. View Real-time Application Logs
```bash
docker compose logs -f insight
```

### 3. Stop Application
```bash
docker compose down
```

---

## 4. Volume Persistence & Security

- **Persistent State**: `./data` is mounted to `/app/data` to ensure SQLite histories (`signbridge.db` / `insight.db`) and user feedback persist across container restarts.
- **Model Isolation**: Hugging Face download cache (`models/huggingface`) and heavy datasets are excluded from image context via `.dockerignore`.
- **Non-Root Execution**: Runs under unprivileged user `appuser` (UID 1000) with least privilege principles.
- **Health Check**: Automated periodic probe via `curl -f http://localhost:8000/api/health` with a 15-second initialization window.
