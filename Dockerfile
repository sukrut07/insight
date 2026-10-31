# Multi-stage Docker build for iNSIGHT Production Showcase
# Stage 1: Build React 18 Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    APP_ENV=production \
    APP_NAME=iNSIGHT

# Install essential system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root application user for secure execution
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/data /app/models/huggingface && \
    chown -R appuser:appuser /app

# Copy application source code
COPY --chown=appuser:appuser backend ./backend
COPY --chown=appuser:appuser ml ./ml
COPY --chown=appuser:appuser config ./config
COPY --chown=appuser:appuser data ./data
COPY --chown=appuser:appuser models ./models

# Copy compiled frontend from Stage 1 into backend static directory
COPY --from=frontend-builder --chown=appuser:appuser /app/frontend/dist ./frontend/dist

# Switch to non-root user
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
