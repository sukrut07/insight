"""SignBridge Backend Configuration."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "SignBridge"
    VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = False

    # Ollama Local AI Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    PRIMARY_LLM: str = "gemma4:e4b"
    FALLBACK_LLM: str = "gemma4:e2b"
    LLM_TIMEOUT_SECONDS: float = 15.0
    DEFAULT_PROVIDER: str = "local_ollama"

    # Optional Hosted Gemini API Rapid Prototyping Mode (Explicit Opt-In)
    GEMINI_API_KEY: str = ""
    GEMINI_API_BASE_URL: str = "https://generativelanguage.googleapis.com"
    GEMINI_GEMMA_MODEL: str = "gemma-4-31b-it"
    GEMINI_FALLBACK_MODEL: str = "gemma-4-26b-a4b-it"
    CLOUD_CONSENT_GRANTED: bool = False

    # Model and Data Paths
    HAND_LANDMARKER_MODEL: Path = PROJECT_ROOT / "models" / "gesture" / "hand_landmarker.task"
    STATIC_MODEL_PATH: Path = PROJECT_ROOT / "models" / "gesture" / "static_rf.joblib"
    TEMPORAL_MODEL_PATH: Path = PROJECT_ROOT / "models" / "gesture" / "temporal_lstm.pt"
    VOCABULARY_PATH: Path = PROJECT_ROOT / "data" / "vocabulary" / "isl_vocabulary.json"
    DATABASE_PATH: Path = PROJECT_ROOT / "data" / "signbridge.db"
    FEEDBACK_DIR: Path = PROJECT_ROOT / "data" / "feedback"
    METRICS_PATH: Path = PROJECT_ROOT / "data" / "model_metrics.json"

    # Audio Settings
    DEFAULT_SPEECH_RATE: int = 175
    DEFAULT_VOICE: str = "Samantha"


settings = Settings()
