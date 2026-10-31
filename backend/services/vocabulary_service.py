"""Service managing plugin-like extensible Indian Sign Language vocabulary."""
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from backend.config import settings, PROJECT_ROOT

logger = logging.getLogger(__name__)

VOCAB_SCHEMA = {
    "type": "object",
    "required": ["label", "type", "hands", "category", "description"],
    "properties": {
        "label": {"type": "string", "pattern": "^[A-Z0-9_]+$"},
        "type": {"type": "string", "enum": ["static", "dynamic"]},
        "hands": {"type": "integer", "minimum": 1, "maximum": 2},
        "category": {"type": "string"},
        "description": {"type": "string", "minLength": 5},
        "frame_count": {"type": "integer", "default": 30}
    }
}


class VocabularyService:
    def __init__(self):
        self.vocab_path: Path = settings.VOCABULARY_PATH
        self.custom_plugin_path: Path = PROJECT_ROOT / "data" / "vocabulary" / "custom_plugins.json"
        self._ensure_paths()

    def _ensure_paths(self):
        self.custom_plugin_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.custom_plugin_path.exists():
            with open(self.custom_plugin_path, "w") as f:
                json.dump({"plugins": []}, f, indent=2)

    def get_all_vocabulary(self) -> Dict[str, Any]:
        """Loads core vocabulary merged with custom contributor plugins."""
        signs = []
        metadata = {
            "name": "ISL Core Vocabulary",
            "version": "1.0.0",
            "source": "Indian Sign Language Research and Training Centre (ISLRTC) Standard",
            "total_core": 0,
            "total_plugins": 0
        }

        if self.vocab_path.exists():
            try:
                with open(self.vocab_path, "r") as f:
                    data = json.load(f)
                    metadata["name"] = data.get("name", metadata["name"])
                    metadata["version"] = data.get("version", metadata["version"])
                    metadata["source"] = data.get("source", metadata["source"])
                    core_signs = data.get("signs", [])
                    for s in core_signs:
                        s["is_plugin"] = False
                    signs.extend(core_signs)
                    metadata["total_core"] = len(core_signs)
            except Exception as e:
                logger.error(f"Failed to read core vocabulary: {e}")

        # Merge custom plugins
        if self.custom_plugin_path.exists():
            try:
                with open(self.custom_plugin_path, "r") as f:
                    plug_data = json.load(f)
                    plugins = plug_data.get("plugins", [])
                    for p in plugins:
                        p["is_plugin"] = True
                    signs.extend(plugins)
                    metadata["total_plugins"] = len(plugins)
            except Exception as e:
                logger.error(f"Failed to read custom plugin vocabulary: {e}")

        return {
            "metadata": metadata,
            "total": len(signs),
            "signs": signs,
            "vocabulary": signs
        }

    def validate_sign_definition(self, item: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validates that a new sign complies with vocabulary specifications."""
        for field in VOCAB_SCHEMA["required"]:
            if field not in item or not str(item[field]).strip():
                return False, f"Missing required field: '{field}'"

        label = str(item["label"]).strip().upper()
        if not label.replace("_", "").isalnum():
            return False, "Label must be uppercase alphanumeric and underscores only."

        sign_type = str(item["type"]).lower()
        if sign_type not in ["static", "dynamic"]:
            return False, "Type must be either 'static' or 'dynamic'."

        try:
            hands = int(item["hands"])
            if hands not in [1, 2]:
                return False, "Hands must be 1 or 2."
        except (ValueError, TypeError):
            return False, "Hands must be an integer (1 or 2)."

        if len(str(item["description"]).strip()) < 5:
            return False, "Description must be at least 5 characters long."

        return True, None

    def register_custom_sign(self, item: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Registers a new custom sign definition plugin."""
        is_valid, err = self.validate_sign_definition(item)
        if not is_valid:
            return False, err or "Invalid sign definition", None

        existing_data = self.get_all_vocabulary()
        existing_labels = {s["label"].upper() for s in existing_data["signs"]}
        new_label = item["label"].strip().upper()

        if new_label in existing_labels:
            return False, f"Sign label '{new_label}' already exists in vocabulary.", None

        # Compute next ID
        max_id = max([s["id"] for s in existing_data["signs"]], default=-1)
        new_id = max_id + 1

        new_entry = {
            "id": new_id,
            "label": new_label,
            "type": item["type"].lower(),
            "hands": int(item["hands"]),
            "category": item.get("category", "custom").strip().lower(),
            "description": item["description"].strip(),
            "frame_count": int(item.get("frame_count", 30)),
            "is_plugin": True
        }

        # Save to custom plugins JSON
        with open(self.custom_plugin_path, "r") as f:
            plugin_store = json.load(f)

        plugin_store["plugins"].append(new_entry)

        with open(self.custom_plugin_path, "w") as f:
            json.dump(plugin_store, f, indent=2)

        return True, f"Successfully registered new sign plugin '{new_label}'.", new_entry


vocabulary_service = VocabularyService()
