"""Session management for isolated multi-user sign language recognition and translation.

Ensures language selection, landmark buffers, temporal state machines, and predictors
are scoped per-session rather than shared in a global mutable variable.
"""
import time
from typing import Dict, Any, List, Optional
from backend.services.recognition_state_machine import RecognitionStateMachine, GlossSegment
from ml.predict import GesturePredictor


class RecognitionSession:
    """Encapsulates isolated state for a single active recognition client."""

    def __init__(self, session_id: str, language: str = "ISL"):
        self.session_id = session_id
        self.language = language.upper()
        self.created_at = time.time()
        self.last_active = time.time()

        # Dedicated state machine and predictor instances
        self.state_machine = RecognitionStateMachine()
        self.predictor = GesturePredictor()

        # Isolated history
        self.token_buffer: List[GlossSegment] = []
        self.prediction_history: List[Dict[str, Any]] = []

    def set_language(self, language: str) -> None:
        self.language = language.upper()
        self.state_machine.reset()
        self.predictor.reset()
        self.token_buffer.clear()
        self.touch()

    def touch(self) -> None:
        self.last_active = time.time()

    def reset_buffer(self) -> None:
        self.state_machine.reset()
        self.predictor.reset()
        self.token_buffer.clear()
        self.touch()


class SessionManager:
    """Manages active user recognition sessions."""

    def __init__(self):
        self._sessions: Dict[str, RecognitionSession] = {}

    def get_or_create_session(self, session_id: str, language: str = "ISL") -> RecognitionSession:
        if not session_id:
            session_id = f"sess_{int(time.time() * 1000)}"
        if session_id not in self._sessions:
            self._sessions[session_id] = RecognitionSession(session_id, language)
        session = self._sessions[session_id]
        session.touch()
        return session

    def get_session(self, session_id: str) -> Optional[RecognitionSession]:
        session = self._sessions.get(session_id)
        if session:
            session.touch()
        return session

    def remove_session(self, session_id: str) -> None:
        if session_id in self._sessions:
            del self._sessions[session_id]

    def cleanup_stale_sessions(self, max_idle_seconds: float = 3600) -> int:
        now = time.time()
        stale = [sid for sid, s in self._sessions.items() if now - s.last_active > max_idle_seconds]
        for sid in stale:
            del self._sessions[sid]
        return len(stale)


session_manager = SessionManager()
