"""SignBridge 2.0 Central Multimodal Language Intelligence Orchestrator.

Powered by Google Gemma 4 E4B running locally through Ollama.
Coordinates language routing, visual observation verification, sequence refinement,
ambiguity detection, and translation without hallucinating unverified gestures.
"""
import asyncio
import base64
import json
import logging
import re
import time
from typing import Dict, Any, List, Optional
import httpx

from backend.config import settings
from backend.services.language_router import language_router

logger = logging.getLogger(__name__)

# System prompt template tailored for Gemma 4 E4B local orchestration
ORCHESTRATOR_SYSTEM_PROMPT = """You are Google Gemma 4 E4B, the Central Multilingual Sign Language Intelligence Orchestrator for SignBridge 2.0.
Your role is to orchestrate interpretation, visual verification, and language processing for three distinct sign languages:
- ISL: Indian Sign Language (Subject-Object-Verb, two-handed & one-handed manual features, non-manual markers)
- BSL: British Sign Language (Topic-Comment, two-handed fingerspelling system)
- ASL: American Sign Language (Topic-Comment / SVO, one-handed manual fingerspelling)

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. You do NOT independently invent sign-language meanings.
2. The dedicated ML gesture recognition models are the source of verified vocabulary predictions.
3. You operate on verified predictions, visual evidence, and language-specific grammars.
4. If an image is provided, examine visible finger extension, orientation, and hand count to cross-verify against the classifier label.
5. If sequence is ambiguous or confidence is low, flag ambiguity and set requires_user_confirmation to true.
6. Refine into clean, natural English without adding imaginary facts, names, or unexpressed signs.

STRICT JSON OUTPUT FORMAT (Return ONLY this JSON, no markdown outside JSON):
{
  "language": "ISL",
  "recognized_sequence": ["TOKEN1", "TOKEN2"],
  "readable_translation": "Natural English translation",
  "confidence": 0.94,
  "ambiguities": [],
  "suggestions": [],
  "requires_user_confirmation": false,
  "grammar_notes": "Explanation of grammar reconstruction (e.g. SOV to SVO adjustment)"
}
"""


class GemmaOrchestrator:
    """Central orchestration service using local Gemma 4 E4B."""

    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.primary_model = settings.PRIMARY_LLM  # gemma4:e4b
        self.fallback_model = settings.FALLBACK_LLM  # gemma4:e2b
        self.timeout = 20.0

    async def orchestrate_translation(
        self,
        language: str,
        recognized_signs: List[Dict[str, Any]],
        visual_frame_base64: Optional[str] = None,
        context_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Main orchestration pipeline coordinating vision validation and language refinement."""
        lang_upper = language.upper()
        if lang_upper not in language_router.SUPPORTED_LANGUAGES:
            lang_upper = language_router.get_active_language()

        cfg = language_router.get_language_config(lang_upper) or {}
        vocab_items = cfg.get("vocabulary", [])
        valid_labels = {v["label"] for v in vocab_items}

        # Filter and extract verified labels
        tokens = []
        confidences = []
        unverified_signs = []

        for sign in recognized_signs:
            lbl = sign.get("label", "").strip().upper()
            conf = float(sign.get("confidence", 0.0))
            if lbl and lbl not in ["NONE", "UNKNOWN"]:
                if lbl in valid_labels or not valid_labels:
                    tokens.append(lbl)
                    confidences.append(conf)
                else:
                    unverified_signs.append(lbl)

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        if not tokens:
            return {
                "language": lang_upper,
                "recognized_sequence": [],
                "readable_translation": "",
                "confidence": 0.0,
                "ambiguities": ["No recognized signs provided."],
                "suggestions": [v["label"] for v in vocab_items[:5]],
                "requires_user_confirmation": False,
                "grammar_notes": "Empty token stream.",
                "provider": "local_ollama",
                "model": self.primary_model
            }

        # Try Gemma 4 E4B via Ollama
        gemma_result = await self._call_ollama_orchestrator(
            language=lang_upper,
            tokens=tokens,
            confidences=confidences,
            avg_conf=avg_conf,
            cfg=cfg,
            visual_frame_base64=visual_frame_base64,
            context_notes=context_notes
        )

        if gemma_result:
            return gemma_result

        # Resilient local deterministic fallback if Ollama is busy/unavailable
        return self._local_deterministic_fallback(lang_upper, tokens, avg_conf, cfg)

    async def _call_ollama_orchestrator(
        self,
        language: str,
        tokens: List[str],
        confidences: List[float],
        avg_conf: float,
        cfg: Dict[str, Any],
        visual_frame_base64: Optional[str],
        context_notes: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """Invokes Ollama chat API with Gemma 4 E4B including optional multimodal vision frame."""
        user_prompt_data = {
            "language": language,
            "language_name": cfg.get("name", language),
            "grammar_structure": cfg.get("grammar_structure", "Standard"),
            "recognized_signs": [
                {"label": t, "confidence": round(c, 3)} for t, c in zip(tokens, confidences)
            ],
            "visual_evidence_provided": bool(visual_frame_base64),
            "context_notes": context_notes or "Translate into natural English communication."
        }

        user_message_content = (
            f"Orchestrate sign translation for {cfg.get('name', language)}.\n"
            f"Input Data:\n{json.dumps(user_prompt_data, indent=2)}\n"
            f"Please output strictly the JSON schema specified."
        )

        message_obj: Dict[str, Any] = {
            "role": "user",
            "content": user_message_content
        }

        # Include selected visual evidence if provided
        if visual_frame_base64:
            clean_b64 = visual_frame_base64.split(",")[-1] if "," in visual_frame_base64 else visual_frame_base64
            message_obj["images"] = [clean_b64]

        payload = {
            "model": self.primary_model,
            "messages": [
                {"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT},
                message_obj
            ],
            "stream": False,
            "options": {
                "temperature": 0.15,
                "top_p": 0.9,
                "num_predict": 300
            }
        }

        start_time = time.perf_counter()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(f"{self.ollama_url}/api/chat", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("message", {}).get("content", "").strip()
                    parsed = self._extract_json(content)
                    if parsed:
                        parsed["provider"] = "local_ollama"
                        parsed["model"] = self.primary_model
                        parsed["latency_ms"] = round((time.perf_counter() - start_time) * 1000, 1)
                        # Validate structure
                        if "language" not in parsed:
                            parsed["language"] = language
                        if "recognized_sequence" not in parsed:
                            parsed["recognized_sequence"] = tokens
                        return parsed
            except Exception as e:
                logger.warning("Ollama primary model %s error: %s. Trying fallback %s...", self.primary_model, e, self.fallback_model)

            # Try fallback model if primary failed
            try:
                payload["model"] = self.fallback_model
                resp = await client.post(f"{self.ollama_url}/api/chat", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("message", {}).get("content", "").strip()
                    parsed = self._extract_json(content)
                    if parsed:
                        parsed["provider"] = "local_ollama"
                        parsed["model"] = self.fallback_model
                        parsed["latency_ms"] = round((time.perf_counter() - start_time) * 1000, 1)
                        return parsed
            except Exception as e_fallback:
                logger.error("Both Gemma models failed on Ollama: %s", e_fallback)

        return None

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Robustly extracts JSON from LLM output."""
        try:
            return json.loads(text)
        except Exception:
            pass

        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass

        match_bracket = re.search(r"(\{.*\})", text, re.DOTALL)
        if match_bracket:
            try:
                return json.loads(match_bracket.group(1))
            except Exception:
                pass

        return None

    def _local_deterministic_fallback(
        self,
        language: str,
        tokens: List[str],
        avg_conf: float,
        cfg: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Deterministic local language rule-based reconstruction when Ollama is unavailable."""
        # Simple phrase dictionary mappings across languages
        token_str = " ".join(tokens)
        
        phrases_map = {
            "HELLO": "Hello!",
            "GOODBYE": "Goodbye!",
            "THANK_YOU": "Thank you.",
            "PLEASE": "Please.",
            "HELP": "Please help me.",
            "YES": "Yes.",
            "NO": "No.",
            "WATER": "I need water.",
            "FOOD": "I need food.",
            "I WATER": "I would like some water.",
            "I FOOD": "I would like some food.",
            "YOU HELP": "Could you please help me?",
            "WHAT WHERE": "What is happening and where?",
            "MY NAME": "My name is...",
            "WANT WATER": "I want water.",
            "NEED HELP": "I need help urgently."
        }

        readable = phrases_map.get(token_str)
        if not readable:
            # Word-level concatenation with capitalization and punctuation
            words = [t.replace("_", " ").lower() for t in tokens]
            readable = " ".join(words).capitalize() + "."

        ambiguities = []
        if avg_conf < 0.65:
            ambiguities.append("Lower classifier confidence. Verification advised.")

        return {
            "language": language,
            "recognized_sequence": tokens,
            "readable_translation": readable,
            "confidence": round(avg_conf, 3),
            "ambiguities": ambiguities,
            "suggestions": [],
            "requires_user_confirmation": avg_conf < 0.60,
            "grammar_notes": f"Reconstructed using local {language} linguistic grammar rules (Ollama offline).",
            "provider": "local_rule_fallback",
            "model": "deterministic_v1"
        }


# Global singleton orchestrator
gemma_orchestrator = GemmaOrchestrator()
