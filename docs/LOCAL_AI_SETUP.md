# Local AI Setup with Ollama and Gemma 4

SignBridge utilizes Google's Gemma 4 models running locally on macOS via Ollama. This architecture provides real-time natural language refinement, grammatical structuring of sign token sequences, and sentence synthesis without sending any data over the internet.

---

## 1. Supported Model Tiers

| Tier | Model Identifier | Parameter Profile | Execution Hardware | Memory Footprint | Target Role |
|:---|:---|:---|:---|:---|:---|
| **Primary** | `gemma4:e4b` | ~4 Billion Params | Apple Silicon M-Series (MLX / Metal) | ~9.5 GB | High-accuracy grammar, context disambiguation, few-shot sentence structuring |
| **Fallback** | `gemma4:e2b` | ~2 Billion Params | Apple Silicon M-Series (MLX / Metal) | ~7.5 GB | Resource-constrained mode, fast fallback on systems under memory pressure |
| **Offline Pass-Through** | *None* | N/A | N/A | 0 MB | Exact literal sign stream output if Ollama is paused or model unavailable |

---

## 2. Verifying Ollama Installation and Status

Check if Ollama is installed:
```bash
ollama --version
```

Start the Ollama daemon if not already running:
```bash
# On macOS, Ollama is usually running as a native menu bar app or launchd service.
# If manual start is required:
ollama serve
```

Verify service reachability:
```bash
curl -s http://localhost:11434/api/tags
```

---

## 3. Pulling and Verifying Gemma Models

Pull models sequentially to monitor disk space and bandwidth:
```bash
# 1. Primary Model (E4B)
ollama pull gemma4:e4b

# 2. Fallback Model (E2B)
ollama pull gemma4:e2b
```

Verify downloaded models:
```bash
ollama list
```

Quick inference sanity test:
```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "gemma4:e4b",
  "prompt": "Respond with OK if functioning.",
  "stream": false
}'
```

---

## 4. Structured Sentence Refinement Prompting

SignBridge feeds structured JSON containing recognized ISL tokens with their detection confidences into Gemma 4.

### Input Schema
```json
{
  "language": "ISL",
  "recognized_signs": [
    {"word": "I", "confidence": 0.98},
    {"word": "WATER", "confidence": 0.92},
    {"word": "WANT", "confidence": 0.89}
  ]
}
```

### System Instruction & Prompt Template
The prompt instructs Gemma to:
1. Maintain the semantic intent of the recognized tokens.
2. Produce a natural, spoken-English sentence.
3. Not fabricate actions or subjects not implied by the tokens.
4. Output strictly valid JSON with the format:
```json
{
  "sentence": "I want water.",
  "refined_tokens": ["I", "WANT", "WATER"],
  "alternatives": ["I would like some water, please."],
  "confidence_score": 0.93
}
```

---

## 5. Fallback & Fault Tolerance Protocol

1. **Connection Failure**: If Ollama daemon at `http://localhost:11434` cannot be reached within 1.5 seconds, the system logs a warning and marks `ollama_available = False`.
2. **Primary Timeout**: If `gemma4:e4b` inference exceeds 4.0 seconds, the request aborts and tries `gemma4:e2b`.
3. **Total Fallback**: If both fail or return unparseable responses, the system gracefully formats the tokens as space-separated literal words (e.g. `"I WATER WANT"`) and delivers it to the UI and TTS without crashing.
