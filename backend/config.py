"""iNSIGHT Backend Configuration and Environment Settings."""
import logging
from pathlib import Path
from typing import Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
logger = logging.getLogger("insight.config")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )

    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "iNSIGHT"
    VERSION: str = "2.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # Ollama Local AI Configuration (Primary: gemma4:e4b, Fallback: gemma4:e2b)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_PRIMARY_MODEL: str = "gemma4:e4b"
    OLLAMA_FALLBACK_MODEL: str = "gemma4:e2b"
    OLLAMA_ENABLED: bool = True
    OLLAMA_TIMEOUT: float = 30.0

    # Backwards-compatible aliases for Ollama
    PRIMARY_LLM: str = "gemma4:e4b"
    FALLBACK_LLM: str = "gemma4:e2b"
    LLM_TIMEOUT_SECONDS: float = 30.0

    # Google Gemini API Cloud Provider (Optional Cloud Reasoning / Multimodal Prototyping)
    GEMINI_API_KEY: str = ""
    GEMINI_API_BASE_URL: str = "https://generativelanguage.googleapis.com"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_GEMMA_MODEL: str = "gemma-4-31b-it"
    GEMINI_FALLBACK_MODEL: str = "gemma-4-26b-a4b-it"
    GEMINI_ENABLED: bool = False
    CLOUD_CONSENT_GRANTED: bool = False

    # Hugging Face Settings
    HF_TOKEN: str = ""
    HF_HOME: Path = PROJECT_ROOT / "models" / "huggingface"
    HF_OFFLINE: bool = False

    # AI Model Routing & Telemetry
    DEFAULT_AI_PROVIDER: str = "local_ollama"
    DEFAULT_PROVIDER: str = "local_ollama"
    ENABLE_CLOUD_FALLBACK: bool = False
    ENABLE_MULTIMODAL_VERIFICATION: bool = True
    ENABLE_MODEL_USAGE_TRACKING: bool = True

    # Recognition Pipeline
    DEFAULT_LANGUAGE: str = "isl"
    RECOGNITION_CONFIDENCE_THRESHOLD: float = 0.60
    TEMPORAL_WINDOW_SIZE: int = 30

    # Voice / Speech Settings
    VOICE_ENABLED: bool = True
    TTS_PROVIDER: str = "browser"
    STT_ENABLED: bool = True
    SPEECH_LANGUAGE: str = "en-IN"
    DEFAULT_SPEECH_RATE: int = 175
    DEFAULT_VOICE: str = "Samantha"

    # Model and Data Paths
    HAND_LANDMARKER_MODEL: Path = PROJECT_ROOT / "models" / "gesture" / "hand_landmarker.task"
    STATIC_MODEL_PATH: Path = PROJECT_ROOT / "models" / "gesture" / "static_rf.joblib"
    TEMPORAL_MODEL_PATH: Path = PROJECT_ROOT / "models" / "gesture" / "temporal_lstm.pt"
    VOCABULARY_PATH: Path = PROJECT_ROOT / "data" / "vocabulary" / "isl_vocabulary.json"
    DATABASE_PATH: Path = (
        PROJECT_ROOT / "data" / "signbridge.db"
        if (PROJECT_ROOT / "data" / "signbridge.db").exists()
        else PROJECT_ROOT / "data" / "insight.db"
    )
    FEEDBACK_DIR: Path = PROJECT_ROOT / "data" / "feedback"
    METRICS_PATH: Path = PROJECT_ROOT / "data" / "model_metrics.json"

    # DigitalOcean (Optional deployment tracking)
    DO_API_TOKEN: str = ""
    DO_APP_ID: str = ""

    def validate_configuration(self) -> Dict[str, Any]:
        """Validates configuration at startup without logging sensitive credentials."""
        status = {
            "app_name": self.APP_NAME,
            "version": self.VERSION,
            "ollama_base_url": self.OLLAMA_BASE_URL,
            "primary_ollama_model": self.OLLAMA_PRIMARY_MODEL or self.PRIMARY_LLM,
            "fallback_ollama_model": self.OLLAMA_FALLBACK_MODEL or self.FALLBACK_LLM,
            "gemini_api_configured": bool(self.GEMINI_API_KEY.strip()),
            "cloud_consent_granted": self.CLOUD_CONSENT_GRANTED,
            "local_only_mode": not (bool(self.GEMINI_API_KEY.strip()) and self.CLOUD_CONSENT_GRANTED),
            "voice_enabled": self.VOICE_ENABLED,
            "stt_enabled": self.STT_ENABLED,
            "hf_cache_dir": str(self.HF_HOME),
        }
        if status["local_only_mode"]:
            logger.info("iNSIGHT initialized in privacy-first LOCAL-ONLY mode (Cloud inference disabled).")
        else:
            logger.info("iNSIGHT initialized with Google Gemini API cloud reasoning enabled.")
        return status


settings = Settings()
