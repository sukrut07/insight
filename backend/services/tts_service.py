"""Text-to-Speech service using macOS native 'say' engine and pyttsx3 fallback."""
import asyncio
import logging
import subprocess
from typing import Optional, List, Dict
import pyttsx3

from backend.config import settings

logger = logging.getLogger(__name__)


class TTSService:
    def __init__(self):
        self.current_process: Optional[subprocess.Popen] = None
        self.default_voice = settings.DEFAULT_VOICE
        self.default_rate = settings.DEFAULT_SPEECH_RATE

    def get_available_voices(self) -> List[Dict[str, str]]:
        """Queries native macOS speech voices."""
        voices = []
        try:
            res = subprocess.run(["say", "-v", "?"], capture_output=True, text=True, check=True)
            for line in res.stdout.strip().split("\n"):
                if line:
                    parts = line.split()
                    name = parts[0]
                    lang = parts[1] if len(parts) > 1 else "en_US"
                    voices.append({"name": name, "locale": lang})
        except Exception as e:
            logger.warning(f"Could not list macOS voices: {e}")
            voices = [{"name": "Samantha", "locale": "en_US"}]
        return voices

    async def speak(self, text: str, voice: Optional[str] = None, rate: Optional[int] = None) -> bool:
        """Speaks the text asynchronously without blocking the event loop."""
        self.stop()
        clean_text = text.strip()
        if not clean_text:
            return False

        selected_voice = voice or self.default_voice
        selected_rate = rate or self.default_rate

        # Primary: Native macOS /usr/bin/say
        try:
            cmd = ["say", "-r", str(selected_rate)]
            if selected_voice:
                cmd.extend(["-v", selected_voice])
            cmd.append(clean_text)

            self.current_process = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return True
        except Exception as e:
            logger.warning(f"Native say failed: {e}. Attempting pyttsx3 fallback...")

        # Fallback: pyttsx3
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._speak_pyttsx3, clean_text, selected_rate)
            return True
        except Exception as ex:
            logger.error(f"pyttsx3 fallback failed: {ex}")
            return False

    def _speak_pyttsx3(self, text: str, rate: int):
        engine = pyttsx3.init()
        engine.setProperty("rate", rate)
        engine.say(text)
        engine.runAndWait()

    def stop(self):
        """Terminates ongoing speech process."""
        if self.current_process and self.current_process.poll() is None:
            try:
                self.current_process.terminate()
            except Exception:
                pass
            self.current_process = None


tts_service = TTSService()
