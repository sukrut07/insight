"""Multilingual Language Router for SignBridge 2.0.

Manages language selection, distinct vocabularies, dedicated classifier pipelines,
and prevents cross-language hallucination across ISL, BSL, and ASL.
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

from backend.config import PROJECT_ROOT

logger = logging.getLogger(__name__)

CONFIG_DIR = PROJECT_ROOT / "config" / "languages"


class LanguageRouter:
    """Central language orchestrator routing recognition and vocabulary lookups."""

    SUPPORTED_LANGUAGES = ["ISL", "BSL", "ASL"]

    def __init__(self, default_language: str = "ISL"):
        self.active_language: str = default_language if default_language in self.SUPPORTED_LANGUAGES else "ISL"
        self._configs: Dict[str, Dict[str, Any]] = {}
        self._load_configurations()

    def _load_configurations(self) -> None:
        """Loads language configurations from config/languages/."""
        for lang_id in self.SUPPORTED_LANGUAGES:
            cfg_path = CONFIG_DIR / f"{lang_id.lower()}.json"
            if cfg_path.exists():
                try:
                    with open(cfg_path, "r", encoding="utf-8") as f:
                        self._configs[lang_id] = json.load(f)
                    logger.info("Loaded configuration for language: %s (status: %s)", lang_id, self._configs[lang_id].get("status"))
                except Exception as e:
                    logger.error("Failed to load config for %s from %s: %s", lang_id, cfg_path, e)
            else:
                logger.warning("Config path not found: %s", cfg_path)

    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Returns metadata for all supported languages."""
        result = []
        for lang_id in self.SUPPORTED_LANGUAGES:
            cfg = self._configs.get(lang_id, {})
            result.append({
                "language_id": lang_id,
                "name": cfg.get("name", lang_id),
                "native_name": cfg.get("native_name", ""),
                "family": cfg.get("family", ""),
                "status": cfg.get("status", "unavailable"),
                "model_version": cfg.get("model_version", "v1"),
                "fingerspelling_type": cfg.get("fingerspelling_type", "unknown"),
                "vocabulary_count": len(cfg.get("vocabulary", [])),
                "alphabet_count": len(cfg.get("alphabet", []))
            })
        return result

    def set_active_language(self, language_id: str) -> bool:
        """Explicitly changes the active recognition language.

        Never allows silent fallback to a different language.
        """
        lang_upper = language_id.upper()
        if lang_upper not in self.SUPPORTED_LANGUAGES:
            logger.warning("Attempted to set unsupported language: %s", language_id)
            return False
        self.active_language = lang_upper
        logger.info("Active sign language set to: %s", self.active_language)
        return True

    def get_active_language(self) -> str:
        return self.active_language

    def get_active_config(self) -> Dict[str, Any]:
        return self._configs.get(self.active_language, {})

    def get_language_config(self, language_id: str) -> Optional[Dict[str, Any]]:
        return self._configs.get(language_id.upper())

    def get_vocabulary(self, language_id: Optional[str] = None) -> List[Dict[str, Any]]:
        lang = (language_id or self.active_language).upper()
        cfg = self._configs.get(lang, {})
        return cfg.get("vocabulary", [])

    def get_alphabet(self, language_id: Optional[str] = None) -> List[Dict[str, Any]]:
        lang = (language_id or self.active_language).upper()
        cfg = self._configs.get(lang, {})
        return cfg.get("alphabet", [])

    def format_prediction_result(
        self,
        label: str,
        confidence: float,
        recognition_type: str = "dynamic",
        is_stable: bool = False,
        raw_prediction: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Formats prediction conforming to standard SignBridge 2.0 prediction schema."""
        cfg = self.get_active_config()
        status_mode = cfg.get("status", "experimental")

        # If language is experimental without trained weights, report transparently
        if status_mode != "active":
            return {
                "language": self.active_language,
                "label": "NONE",
                "confidence": 0.0,
                "model_version": cfg.get("model_version", "prototype"),
                "recognition_type": "none",
                "status": "model_pending",
                "is_stable": False,
                "message": f"{cfg.get('name', self.active_language)} classifier is currently in experimental / training phase. Sign reference and visual practice are active."
            }

        # Active language evaluation with calibrated confidence tiers
        # High: >= 0.75, Medium: 0.45 - 0.75, Low: < 0.45
        if confidence >= 0.75 and label not in ["NONE", "UNKNOWN"]:
            confidence_tier = "high"
            status = "recognized"
            recognition_status = "high_confidence"
            display_label = label
            message = "Sign successfully recognised."
        elif confidence >= 0.45 and label not in ["NONE", "UNKNOWN"]:
            confidence_tier = "medium"
            status = "uncertain"
            recognition_status = "medium_confidence"
            display_label = label
            message = "Possible interpretation. Confirmation required."
        else:
            confidence_tier = "low"
            status = "unsupported"
            recognition_status = "low_confidence"
            display_label = "NONE"
            message = "Sign not recognised. Please reposition hands or repeat gesture."

        return {
            "language": self.active_language,
            "label": display_label,
            "raw_label": label,
            "confidence": round(confidence, 3),
            "confidence_tier": confidence_tier,
            "model_version": cfg.get("model_version", "isl_v1"),
            "recognition_type": recognition_type,
            "status": status,
            "recognition_status": recognition_status,
            "message": message,
            "is_stable": is_stable,
            "raw_prediction": raw_prediction or {}
        }



# Global singleton instance
language_router = LanguageRouter(default_language="ISL")
