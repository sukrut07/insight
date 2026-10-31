# iNSIGHT — System Technical Audit & Architecture Review
**Date**: October 31, 2026  
**Auditor**: Senior AI/ML & DevOps Engineer  
**Baseline Test Status**: 34 / 34 PASSED (`pytest` execution: 94.74s)

---

## 1. Executive Summary

This audit evaluates the codebase of **iNSIGHT** (formerly *SignBridge*), a local-first, multilingual sign language communication platform powered by computer vision, gesture recognition classifiers, and Google Gemma 4 models orchestrated via Ollama, with optional Google Gemini API cloud integration.

The repository demonstrates strong foundational components:
- Standardized 148-dimensional canonical landmark feature extraction pipeline.
- Holistic landmark fusion with modality masks (`hands`, `face`, `pose`) and non-manual marker tracking.
- Per-user session isolation (`SessionManager`) and frame-freshness WebSocket queues.
- Local Ollama deployment with installed models `gemma4:e4b` (9.5 GB) and `gemma4:e2b` (7.5 GB).

This audit identifies 7 specific issues across AI orchestration, container runtime, environment configuration, and voice enablement, categorized by severity (P0, P1, P2).

---

## 2. Detailed Findings & Issue Register

| # | Issue Summary | Severity | Root Cause | Affected File(s) | Proposed Fix | Validation Method |
|---|---|---|---|---|---|---|
| **1** | Fragmented AI provider orchestration | **P0** | Gemini and Ollama calls are duplicated across `gemma_service.py` and `gemma_orchestrator.py` without unified provider abstraction (`GeminiProvider`, `OllamaGemmaE4BProvider`, `OllamaGemmaE2BProvider`) or intelligent task-based routing. | `backend/services/gemma_service.py`<br>`backend/services/gemma_orchestrator.py` | Create unified `backend/services/model_orchestrator.py` implementing unified provider classes, fallback hierarchy, and task routing. | Unit & integration tests for provider switching and fallback. |
| **2** | Production Docker container does not serve frontend SPA | **P0** | `Dockerfile` builds React frontend into `frontend/dist`, but `backend/main.py` never mounts `StaticFiles` or provides SPA fallback. Requests to container root return JSON API root instead of React UI. | `backend/main.py`<br>`Dockerfile`<br>`docker-compose.yml` | Mount `frontend/dist` with `StaticFiles` in `backend/main.py` if directory exists, with catch-all route for HTML5 history API. | Verify static file mounting and root route in test suite. |
| **3** | Incomplete & inconsistent environment schema | **P1** | `.env.example` lacks required keys for Hugging Face caching (`HF_HOME`), voice settings (`VOICE_ENABLED`, `TTS_PROVIDER`, `STT_ENABLED`), and startup validation. | `.env.example`<br>`backend/config.py` | Standardize all variables in `backend/config.py` with typed defaults and startup validation, sync `.env.example`. | Configuration loading test verifying all required variables. |
| **4** | Deprecated Pydantic V2 `.dict()` invocation | **P1** | In `gemma_orchestrator.py` (line 290), `validated.dict()` is called instead of `validated.model_dump()`, causing runtime deprecation warnings. | `backend/services/gemma_orchestrator.py` | Replace `.dict()` with `.model_dump()`. | Run `pytest` to confirm zero deprecation warnings. |
| **5** | Lack of bidirectional Voice (STT missing) | **P1** | While browser TTS output exists, voice input (Speech-to-Text) for hearing communication partners is absent in the Live Translator interface. | `frontend/src/pages/TranslatorPage.tsx`<br>`frontend/src/components/VoiceOutput.tsx` | Implement Web Speech API speech-to-text listener hook and UI controls (mic toggle, status chip, transcripts). | Manual and browser-level mock validation. |
| **6** | Container-to-host Ollama networking gap | **P1** | Docker containers trying to connect to `http://localhost:11434` fail because localhost refers to the container itself, not the host machine. | `docker-compose.yml`<br>`Dockerfile` | Add `extra_hosts: ["host.docker.internal:host-gateway"]` and configure default `OLLAMA_BASE_URL` to `http://host.docker.internal:11434` inside Docker. | Compose syntax validation and network ping check. |
| **7** | Missing reproducible benchmark suite | **P2** | Benchmarks were previously reported on model cards rather than executed locally via an automated benchmark runner script. | `ml/` (missing `ml/benchmark/`) | Build `ml/benchmark/` suite containing latency, accuracy, WER, and provider evaluation scripts with markdown reports. | Execute benchmark scripts and verify generated markdown reports. |

---

## 3. Baseline Test Verification

Prior to modifying source code, the complete test suite was executed in the local virtual environment (`.venv/bin/pytest`):

```
============================= test session starts ==============================
platform darwin -- Python 3.11.14, pytest-9.2.0, pluggy-1.7.0
rootdir: /Users/sukrutdusane/Documents/Projects /Sy/sign_language_identifier
configfile: pytest.ini
plugins: asyncio-1.4.1, anyio-4.15.1
collected 34 items

backend/tests/test_gemma_vision.py .                                     [  2%]
tests/test_feature_schema.py .....                                       [ 17%]
tests/test_holistic_and_sessions.py ...                                  [ 26%]
tests/test_model_registry.py .....                                       [ 41%]
tests/test_multilingual.py ......                                        [ 58%]
tests/test_pipeline.py ..............                                    [100%]

======================== 34 passed in 94.74s (0:01:34) =========================
```

All 34 baseline tests passed with zero failures.

---

## 4. Local Model Inventory Verification

Ollama CLI inspection (`ollama list`) confirms:
- **`gemma4:e4b`** (ID: `eb2177adf764`, Size: `9.5 GB`) — **Installed & Available** (Primary Local Model)
- **`gemma4:e2b`** (ID: `45d11505b91d`, Size: `7.5 GB`) — **Installed & Available** (Fallback Local Model)

Both models are verified on the local host machine, ready for live inference testing in Sprint 4.
