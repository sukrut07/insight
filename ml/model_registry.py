"""Central Sign Language Model Registry for iNSIGHT.

Manages language-specific recognizers (ISL, BSL, ASL), registers Hugging Face
benchmark candidates, and provides strict isolation between distinct sign languages.
"""
from typing import Dict, Any, List, Optional
import logging

from ml.recognizer_interface import SignLanguageRecognizer
from ml.isl.recognizer import ISLRecognizer
from ml.bsl.recognizer import BSLRecognizer
from ml.asl.recognizer import ASLRecognizer

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Central registry and factory for language-specific sign language recognizers."""

    def __init__(self):
        self._recognizers: Dict[str, SignLanguageRecognizer] = {}
        self._initialize_default_recognizers()

    def _initialize_default_recognizers(self) -> None:
        """Initializes default production and candidate recognizers."""
        try:
            self._recognizers["ISL"] = ISLRecognizer()
            self._recognizers["BSL"] = BSLRecognizer()
            self._recognizers["ASL"] = ASLRecognizer()
            logger.info("ModelRegistry successfully initialized ISL, BSL, and ASL adapters.")
        except Exception as e:
            logger.error("Error initializing model recognizers in registry: %s", e)

    def get_recognizer(self, language: str) -> SignLanguageRecognizer:
        """Retrieves the dedicated recognizer for the specified language.

        Never silently falls back across distinct sign languages.
        """
        lang_upper = language.upper()
        if lang_upper not in self._recognizers:
            raise KeyError(
                f"Unsupported sign language '{language}'. "
                f"Supported languages in registry: {list(self._recognizers.keys())}"
            )
        return self._recognizers[lang_upper]

    def register_recognizer(self, language: str, recognizer: SignLanguageRecognizer) -> None:
        """Registers a custom or fine-tuned recognizer into the registry."""
        if not isinstance(recognizer, SignLanguageRecognizer):
            raise TypeError(f"Recognizer must implement SignLanguageRecognizer, got {type(recognizer)}")
        self._recognizers[language.upper()] = recognizer
        logger.info("Custom recognizer registered for language: %s", language.upper())

    def list_models(self) -> List[Dict[str, Any]]:
        """Lists metadata and readiness status for all registered language models."""
        results = []
        for lang, recognizer in self._recognizers.items():
            meta = recognizer.get_model_metadata()
            results.append({
                "language": lang,
                "status": meta.get("status", "unknown"),
                "model_version": meta.get("model_version", "v1"),
                "primary_architecture": meta.get("primary_architecture", "custom"),
                "vocabulary_count": meta.get("vocabulary_count", 0),
                "candidate_evaluations": meta.get("candidate_evaluations", []),
                "metadata": meta,
            })
        return results

    def get_model_status(self, language: str) -> Dict[str, Any]:
        """Returns readiness status and architecture specifications for a given language."""
        recognizer = self.get_recognizer(language)
        return recognizer.get_model_metadata()


# Global singleton registry
model_registry = ModelRegistry()
