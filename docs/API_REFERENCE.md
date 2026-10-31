# SignBridge API Reference

SignBridge exposes a local REST and WebSocket API via FastAPI running on `http://127.0.0.1:8000`.

---

## 1. System & Model Endpoints

### `GET /api/health`
Returns the status of the local backend, uptime, and host device information.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "device": "mps",
  "memory_gb": 16.0
}
```

### `GET /api/models/status`
Checks the operational readiness of MediaPipe, PyTorch gesture weights, and local Ollama models.

**Response (200 OK):**
```json
{
  "mediapipe_ready": true,
  "static_model_loaded": true,
  "temporal_model_loaded": true,
  "ollama_available": true,
  "active_llm": "gemma4:e4b",
  "fallback_llm_available": true
}
```

### `GET /api/vocabulary`
Returns the list of supported ISL signs and their metadata.

**Response (200 OK):**
```json
{
  "total": 15,
  "vocabulary": [
    {"label": "HELLO", "type": "dynamic", "hands": 1},
    {"label": "HELP", "type": "dynamic", "hands": 2},
    {"label": "I", "type": "static", "hands": 1}
  ]
}
```

---

## 2. Recognition & Gesture Inference

### `POST /api/gesture/predict`
Predicts a gesture from a single frame's extracted landmarks or a buffered sequence.

**Request Body:**
```json
{
  "landmarks": [
    {"x": 0.54, "y": 0.42, "z": -0.02}
  ],
  "handedness": ["Right"]
}
```

**Response (200 OK):**
```json
{
  "label": "HELLO",
  "confidence": 0.94,
  "is_stable": true,
  "inference_time_ms": 4.2
}
```

---

## 3. Translation & Language Refinement

### `POST /api/translation/refine`
Accepts a sequence of raw recognized signs and invokes local Gemma 4 to produce a natural English sentence.

**Request Body:**
```json
{
  "signs": [
    {"word": "I", "confidence": 0.97},
    {"word": "HELP", "confidence": 0.93},
    {"word": "NEED", "confidence": 0.88}
  ]
}
```

**Response (200 OK):**
```json
{
  "original_tokens": ["I", "HELP", "NEED"],
  "refined_sentence": "I need help.",
  "model_used": "gemma4:e4b",
  "execution_time_ms": 420.5
}
```

---

## 4. Text-to-Speech

### `POST /api/speech/speak`
Synthesizes speech using the local offline macOS voice engine.

**Request Body:**
```json
{
  "text": "I need help.",
  "rate": 180,
  "voice": "default"
}
```

**Response (200 OK):**
```json
{
  "status": "speaking",
  "text": "I need help."
}
```

---

## 5. WebSocket Gateway: `/ws/recognition`

High-speed bidirectional streaming channel for live camera frames and continuous gesture feedback.

### Client Message (Frame Send)
```json
{
  "type": "frame",
  "image": "data:image/jpeg;base64,...",
  "timestamp": 1729837192.12
}
```

### Server Message (Live Telemetry & Prediction)
```json
{
  "type": "prediction",
  "detected_hands": 1,
  "handedness": ["Right"],
  "landmarks": [...],
  "current_sign": "HELLO",
  "confidence": 0.94,
  "sentence_buffer": ["HELLO"],
  "fps": 28.5
}
```
