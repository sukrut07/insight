"""Dependency injection providers for FastAPI."""
from backend.services.landmark_service import landmark_service
from backend.services.gesture_service import gesture_service
from backend.services.gemma_service import gemma_service
from backend.services.tts_service import tts_service
from backend.services.feedback_service import feedback_service


def get_landmark_service():
    return landmark_service


def get_gesture_service():
    return gesture_service


def get_gemma_service():
    return gemma_service


def get_tts_service():
    return tts_service


def get_feedback_service():
    return feedback_service
