"""Unified AI Model Orchestration Engine for iNSIGHT.

Supports:
1. GeminiProvider: Google GenAI cloud provider (optional, explicit consent required).
2. OllamaGemmaE4BProvider: Local Google Gemma 4 E4B primary reasoning engine.
3. OllamaGemmaE2BProvider: Local Google Gemma 4 E2B lightweight fallback engine.
4. DeterministicRuleProvider: Resilient local fallback when all neural providers are unavailable.
5. Task-Based Intelligent Routing: Directs tasks to the optimal tier (RF, BiLSTM, E4B, E2B, Gemini).
"""
import asyncio
import base64
import json
import logging
import re
import time
from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Any, List, Optional, Union

import httpx
from pydantic import BaseModel, Field

from backend.config import settings

logger = logging.getLogger("insight.orchestrator")


class TaskType(str, Enum):
    """Categorization of AI tasks for intelligent routing."""
    STATIC_CLASSIFICATION = "static_classification"
    DYNAMIC_RECOGNITION = "dynamic_recognition"
    CONTINUOUS_RECOGNITION = "continuous_recognition"
    TEXT_FORMATTING = "text_formatting"
    AMBIGUOUS_VERIFICATION = "ambiguous_verification"
    LIGHTWEIGHT_ASSIST = "lightweight_assist"
    LINGUISTIC_RECONSTRUCTION = "linguistic_reconstruction"
    VISUAL_VERIFICATION = "visual_verification"


class ProviderType(str, Enum):
    """Supported provider backends."""
    GEMINI_API = "gemini_api"
    OLLAMA_E4B = "ollama_e4b"
    OLLAMA_E2B = "ollama_e2b"
    DETERMINISTIC = "deterministic"


class ModelRequest(BaseModel):
    """Unified request schema for reasoning and multimodal tasks."""
    prompt: str
    system_prompt: Optional[str] = None
    task_type: TaskType = TaskType.LINGUISTIC_RECONSTRUCTION
    images_base64: List[str] = Field(default_factory=list)
    structured_json: bool = True
    temperature: float = 0.15
    max_tokens: int = 300
    session_id: Optional[str] = None
    allow_cloud: bool = False


class ModelResponse(BaseModel):
    """Standardized response schema containing output and telemetry."""
    provider: str
    model: str
    content: str
    parsed_json: Optional[Dict[str, Any]] = None
    latency_ms: float = 0.0
    token_usage: Optional[Dict[str, int]] = None
    status: str = "success"  # success, fallback, error
    error_message: Optional[str] = None
    is_fallback: bool = False


def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """Extracts valid JSON dictionary from LLM response text."""
    if not text:
        return None
    cleaned = text.strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Markdown block match
    match_md = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if match_md:
        try:
            return json.loads(match_md.group(1))
        except Exception:
            pass

    # First and last curly brace match
    match_braces = re.search(r"(\{.*\})", cleaned, re.DOTALL)
    if match_braces:
        try:
            return json.loads(match_braces.group(1))
        except Exception:
            pass

    return None


class BaseAIProvider(ABC):
    """Abstract interface for AI inference providers."""

    @abstractmethod
    async def is_available(self) -> bool:
        """Checks if the provider endpoint and model are ready."""
        pass

    @abstractmethod
    async def generate(self, request: ModelRequest) -> ModelResponse:
        """Executes inference on the target provider."""
        pass


class GeminiProvider(BaseAIProvider):
    """Google Gemini API cloud provider for advanced multimodal reasoning (Optional)."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY.strip()
        self.base_url = settings.GEMINI_API_BASE_URL.rstrip("/")
        self.model = settings.GEMINI_MODEL or "gemini-1.5-flash"
        self.gemma_model = settings.GEMINI_GEMMA_MODEL or "gemma-4-31b-it"
        self.timeout = 15.0

    async def is_available(self) -> bool:
        """Gemini is available only if an API key is configured and cloud consent is granted."""
        if not self.api_key or not settings.CLOUD_CONSENT_GRANTED:
            return False
        try:
            # Lightweight connectivity check
            url = f"{self.base_url}/v1beta/models/{self.model}?key={self.api_key}"
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(url)
                return resp.status_code == 200
        except Exception as e:
            logger.debug(f"Gemini API check failed: {e}")
            return False

    async def generate(self, request: ModelRequest) -> ModelResponse:
        t0 = time.perf_counter()
        if not self.api_key:
            return ModelResponse(
                provider=ProviderType.GEMINI_API.value,
                model=self.model,
                content="",
                status="error",
                error_message="Gemini API key is not configured.",
                is_fallback=True
            )
        if not request.allow_cloud and not settings.CLOUD_CONSENT_GRANTED:
            return ModelResponse(
                provider=ProviderType.GEMINI_API.value,
                model=self.model,
                content="",
                status="error",
                error_message="Cloud inference blocked: User consent not granted for cloud transmission.",
                is_fallback=True
            )

        parts: List[Dict[str, Any]] = []
        if request.system_prompt:
            parts.append({"text": f"System Directive:\n{request.system_prompt}\n\n"})
        parts.append({"text": request.prompt})

        # Append images if provided and permitted
        for img_b64 in request.images_base64:
            clean_b64 = img_b64.split(",", 1)[-1] if "," in img_b64 else img_b64
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": clean_b64
                }
            })

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens,
            }
        }
        if request.structured_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        target_model = self.model
        url = f"{self.base_url}/v1beta/models/{target_model}:generateContent?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload)
                elapsed_ms = (time.perf_counter() - t0) * 1000

                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    raw_text = ""
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        raw_text = "".join(p.get("text", "") for p in content_parts)

                    parsed = extract_json_from_text(raw_text) if request.structured_json else None
                    usage_metadata = data.get("usageMetadata", {})
                    token_usage = {
                        "prompt_tokens": usage_metadata.get("promptTokenCount", 0),
                        "completion_tokens": usage_metadata.get("candidatesTokenCount", 0),
                        "total_tokens": usage_metadata.get("totalTokenCount", 0)
                    }

                    return ModelResponse(
                        provider=ProviderType.GEMINI_API.value,
                        model=target_model,
                        content=raw_text,
                        parsed_json=parsed,
                        latency_ms=round(elapsed_ms, 1),
                        token_usage=token_usage,
                        status="success"
                    )
                elif resp.status_code == 429:
                    return ModelResponse(
                        provider=ProviderType.GEMINI_API.value,
                        model=target_model,
                        content="",
                        status="error",
                        error_message="Gemini API rate limit exceeded (HTTP 429).",
                        latency_ms=round(elapsed_ms, 1),
                        is_fallback=True
                    )
                else:
                    return ModelResponse(
                        provider=ProviderType.GEMINI_API.value,
                        model=target_model,
                        content="",
                        status="error",
                        error_message=f"Gemini API error HTTP {resp.status_code}: {resp.text[:200]}",
                        latency_ms=round(elapsed_ms, 1),
                        is_fallback=True
                    )
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            return ModelResponse(
                provider=ProviderType.GEMINI_API.value,
                model=target_model,
                content="",
                status="error",
                error_message=f"Gemini API request failed: {str(e)}",
                latency_ms=round(elapsed_ms, 1),
                is_fallback=True
            )


class OllamaGemmaE4BProvider(BaseAIProvider):
    """Local Google Gemma 4 E4B primary reasoning engine via Ollama."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_PRIMARY_MODEL or settings.PRIMARY_LLM or "gemma4:e4b"
        self.timeout = float(settings.OLLAMA_TIMEOUT or settings.LLM_TIMEOUT_SECONDS or 30.0)

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m["name"] for m in res.json().get("models", [])]
                    return any(self.model in m for m in models)
        except Exception:
            pass
        return False

    async def generate(self, request: ModelRequest) -> ModelResponse:
        t0 = time.perf_counter()
        full_prompt = f"{request.system_prompt}\n\n{request.prompt}" if request.system_prompt else request.prompt

        # Gemma 4 MLX models in Ollama utilize thinking tokens; provide sufficient token headroom
        token_budget = max(request.max_tokens, 550)

        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": request.temperature,
                "num_predict": token_budget
            }
        }

        # Vision support if images present
        if request.images_base64:
            clean_images = [
                img.split(",", 1)[-1] if "," in img else img
                for img in request.images_base64
            ]
            payload["images"] = clean_images

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                elapsed_ms = (time.perf_counter() - t0) * 1000

                if res.status_code == 200:
                    data = res.json()
                    raw_text = data.get("response", "").strip()
                    parsed = extract_json_from_text(raw_text) if request.structured_json else None
                    token_usage = {
                        "prompt_tokens": data.get("prompt_eval_count", 0),
                        "completion_tokens": data.get("eval_count", 0),
                        "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)
                    }
                    return ModelResponse(
                        provider=ProviderType.OLLAMA_E4B.value,
                        model=self.model,
                        content=raw_text,
                        parsed_json=parsed,
                        latency_ms=round(elapsed_ms, 1),
                        token_usage=token_usage,
                        status="success"
                    )
                else:
                    return ModelResponse(
                        provider=ProviderType.OLLAMA_E4B.value,
                        model=self.model,
                        content="",
                        status="error",
                        error_message=f"Ollama E4B HTTP {res.status_code}: {res.text[:150]}",
                        latency_ms=round(elapsed_ms, 1),
                        is_fallback=True
                    )
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            return ModelResponse(
                provider=ProviderType.OLLAMA_E4B.value,
                model=self.model,
                content="",
                status="error",
                error_message=f"Ollama E4B call error: {str(e)}",
                latency_ms=round(elapsed_ms, 1),
                is_fallback=True
            )


class OllamaGemmaE2BProvider(BaseAIProvider):
    """Local Google Gemma 4 E2B lightweight fallback engine via Ollama."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_FALLBACK_MODEL or settings.FALLBACK_LLM or "gemma4:e2b"
        self.timeout = float(settings.OLLAMA_TIMEOUT or settings.LLM_TIMEOUT_SECONDS or 20.0)

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m["name"] for m in res.json().get("models", [])]
                    return any(self.model in m for m in models)
        except Exception:
            pass
        return False

    async def generate(self, request: ModelRequest) -> ModelResponse:
        t0 = time.perf_counter()
        full_prompt = f"{request.system_prompt}\n\n{request.prompt}" if request.system_prompt else request.prompt

        token_budget = max(request.max_tokens, 450)

        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": request.temperature,
                "num_predict": token_budget
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                elapsed_ms = (time.perf_counter() - t0) * 1000

                if res.status_code == 200:
                    data = res.json()
                    raw_text = data.get("response", "").strip()
                    parsed = extract_json_from_text(raw_text) if request.structured_json else None
                    token_usage = {
                        "prompt_tokens": data.get("prompt_eval_count", 0),
                        "completion_tokens": data.get("eval_count", 0),
                        "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)
                    }
                    return ModelResponse(
                        provider=ProviderType.OLLAMA_E2B.value,
                        model=self.model,
                        content=raw_text,
                        parsed_json=parsed,
                        latency_ms=round(elapsed_ms, 1),
                        token_usage=token_usage,
                        status="success",
                        is_fallback=True
                    )
                else:
                    return ModelResponse(
                        provider=ProviderType.OLLAMA_E2B.value,
                        model=self.model,
                        content="",
                        status="error",
                        error_message=f"Ollama E2B HTTP {res.status_code}: {res.text[:150]}",
                        latency_ms=round(elapsed_ms, 1),
                        is_fallback=True
                    )
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            return ModelResponse(
                provider=ProviderType.OLLAMA_E2B.value,
                model=self.model,
                content="",
                status="error",
                error_message=f"Ollama E2B call error: {str(e)}",
                latency_ms=round(elapsed_ms, 1),
                is_fallback=True
            )


class DeterministicRuleProvider(BaseAIProvider):
    """Zero-dependency local rule fallback ensuring 100% offline uptime."""

    async def is_available(self) -> bool:
        return True

    async def generate(self, request: ModelRequest) -> ModelResponse:
        t0 = time.perf_counter()
        # Extract keywords/signs from prompt
        words = re.findall(r"\b[A-Z_]{2,}\b", request.prompt)
        filtered = [w for w in words if w not in {"ISL", "ASL", "BSL", "JSON", "TRUE", "FALSE"}]
        sentence = " ".join([w.replace("_", " ").lower() for w in filtered]).capitalize() + "." if filtered else "Recognition standby."

        parsed = {
            "sentence": sentence,
            "refined_tokens": filtered,
            "alternatives": [],
            "notes": "Generated by deterministic rule provider (neural models offline)."
        }
        elapsed_ms = (time.perf_counter() - t0) * 1000

        return ModelResponse(
            provider=ProviderType.DETERMINISTIC.value,
            model="deterministic_rules_v1",
            content=json.dumps(parsed),
            parsed_json=parsed,
            latency_ms=round(elapsed_ms, 2),
            status="success",
            is_fallback=True
        )


class ModelOrchestrator:
    """Central manager coordinating providers and task routing."""

    def __init__(self):
        self.gemini = GeminiProvider()
        self.ollama_e4b = OllamaGemmaE4BProvider()
        self.ollama_e2b = OllamaGemmaE2BProvider()
        self.deterministic = DeterministicRuleProvider()

        # Telemetry
        self.total_routed_tasks: int = 0
        self.provider_usage: Dict[str, int] = {
            ProviderType.GEMINI_API.value: 0,
            ProviderType.OLLAMA_E4B.value: 0,
            ProviderType.OLLAMA_E2B.value: 0,
            ProviderType.DETERMINISTIC.value: 0
        }

    async def get_provider_status(self) -> Dict[str, Any]:
        """Audits readiness across all AI providers."""
        gemini_ok = await self.gemini.is_available()
        e4b_ok = await self.ollama_e4b.is_available()
        e2b_ok = await self.ollama_e2b.is_available()

        # Determine currently active default provider
        default_p = settings.DEFAULT_AI_PROVIDER or settings.DEFAULT_PROVIDER
        if default_p == ProviderType.GEMINI_API.value and gemini_ok:
            active_p = ProviderType.GEMINI_API.value
            active_m = self.gemini.model
        elif e4b_ok:
            active_p = ProviderType.OLLAMA_E4B.value
            active_m = self.ollama_e4b.model
        elif e2b_ok:
            active_p = ProviderType.OLLAMA_E2B.value
            active_m = self.ollama_e2b.model
        else:
            active_p = ProviderType.DETERMINISTIC.value
            active_m = "deterministic_v1"

        return {
            "active_provider": active_p,
            "active_model": active_m,
            "providers": {
                ProviderType.GEMINI_API.value: {
                    "available": gemini_ok,
                    "model": self.gemini.model,
                    "configured": bool(settings.GEMINI_API_KEY.strip()),
                    "cloud_consent": settings.CLOUD_CONSENT_GRANTED
                },
                ProviderType.OLLAMA_E4B.value: {
                    "available": e4b_ok,
                    "model": self.ollama_e4b.model,
                    "primary": True
                },
                ProviderType.OLLAMA_E2B.value: {
                    "available": e2b_ok,
                    "model": self.ollama_e2b.model,
                    "fallback": True
                },
                ProviderType.DETERMINISTIC.value: {
                    "available": True,
                    "model": "deterministic_rules_v1"
                }
            },
            "telemetry": {
                "total_routed_tasks": self.total_routed_tasks,
                "provider_usage": self.provider_usage
            }
        }

    async def execute_task(
        self,
        request: ModelRequest,
        preferred_provider: Optional[str] = None
    ) -> ModelResponse:
        """Executes reasoning/verification with intelligent hierarchy and fallback."""
        self.total_routed_tasks += 1
        provider_preference = preferred_provider or settings.DEFAULT_AI_PROVIDER or settings.DEFAULT_PROVIDER

        # Direct explicit route if deterministic requested
        if provider_preference == ProviderType.DETERMINISTIC.value:
            det_resp = await self.deterministic.generate(request)
            self.provider_usage[ProviderType.DETERMINISTIC.value] += 1
            return det_resp

        # 1. Cloud Gemini Attempt (Only if preferred, configured, and consented)
        if provider_preference == ProviderType.GEMINI_API.value and settings.CLOUD_CONSENT_GRANTED:
            gemini_resp = await self.gemini.generate(request)
            if gemini_resp.status == "success":
                self.provider_usage[ProviderType.GEMINI_API.value] += 1
                return gemini_resp
            logger.warning(f"Gemini API attempt failed: {gemini_resp.error_message}. Falling back to Ollama E4B...")

        # Explicit route for E2B
        if provider_preference == ProviderType.OLLAMA_E2B.value:
            e2b_resp = await self.ollama_e2b.generate(request)
            if e2b_resp.status == "success":
                self.provider_usage[ProviderType.OLLAMA_E2B.value] += 1
                return e2b_resp
            logger.warning("Ollama E2B failed. Falling back to deterministic rules...")
            det_resp = await self.deterministic.generate(request)
            self.provider_usage[ProviderType.DETERMINISTIC.value] += 1
            return det_resp

        # 2. Primary Local Model: Gemma 4 E4B
        e4b_resp = await self.ollama_e4b.generate(request)
        if e4b_resp.status == "success":
            self.provider_usage[ProviderType.OLLAMA_E4B.value] += 1
            return e4b_resp
        logger.warning(f"Ollama E4B attempt failed: {e4b_resp.error_message}. Falling back to Ollama E2B...")

        # 3. Fallback Local Model: Gemma 4 E2B
        e2b_resp = await self.ollama_e2b.generate(request)
        if e2b_resp.status == "success":
            self.provider_usage[ProviderType.OLLAMA_E2B.value] += 1
            e2b_resp.is_fallback = True
            return e2b_resp
        logger.warning(f"Ollama E2B attempt failed: {e2b_resp.error_message}. Falling back to deterministic rules...")

        # 4. Deterministic Local Fallback
        det_resp = await self.deterministic.generate(request)
        self.provider_usage[ProviderType.DETERMINISTIC.value] += 1
        return det_resp


# Global singleton instance
model_orchestrator = ModelOrchestrator()
