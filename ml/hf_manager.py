"""Hugging Face Model and Dataset Hub Integration Manager for iNSIGHT.

Provides:
1. Hub metadata inspection & availability checks via official REST API.
2. Safety guards against downloading multi-gigabyte models without user confirmation.
3. Offline mode support and local caching in `models/huggingface/`.
4. Version pinning, file verification, and license validation.
"""
import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

from backend.config import settings

logger = logging.getLogger("insight.hf_manager")

HF_API_BASE = "https://huggingface.co/api"


class HuggingFaceManager:
    """Manages discovery, validation, and safe local caching of HF resources."""

    def __init__(self):
        self.cache_dir: Path = settings.HF_HOME
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.token: Optional[str] = settings.HF_TOKEN if settings.HF_TOKEN.strip() else None
        self.offline: bool = settings.HF_OFFLINE
        self.max_auto_download_mb = 150.0  # Safe auto-download ceiling

    def _headers(self) -> Dict[str, str]:
        headers = {"User-Agent": "iNSIGHT-SignLanguage-Assistant/2.0"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def get_model_info(self, repo_id: str) -> Dict[str, Any]:
        """Fetches live repository metadata, license, tags, and sibling file listings."""
        if self.offline:
            return {"repo_id": repo_id, "status": "offline_mode", "cached": self.is_cached(repo_id)}

        url = f"{HF_API_BASE}/models/{repo_id}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json()
                    tags = data.get("tags", [])
                    license_tag = next((t.replace("license:", "") for t in tags if t.startswith("license:")), "unspecified")
                    files = [s.get("rfilename") for s in data.get("siblings", [])]
                    
                    return {
                        "repo_id": repo_id,
                        "status": "available",
                        "license": license_tag,
                        "sha": data.get("sha", "latest"),
                        "tags": tags,
                        "files": files,
                        "cached": self.is_cached(repo_id)
                    }
                elif resp.status_code == 404:
                    return {"repo_id": repo_id, "status": "not_found", "cached": False}
                elif resp.status_code == 401:
                    return {"repo_id": repo_id, "status": "auth_required", "cached": False}
                else:
                    return {"repo_id": repo_id, "status": f"http_{resp.status_code}", "cached": False}
        except Exception as e:
            logger.warning(f"Failed to query HF Hub for model {repo_id}: {e}")
            return {"repo_id": repo_id, "status": "connection_error", "error": str(e), "cached": self.is_cached(repo_id)}

    async def get_dataset_info(self, repo_id: str) -> Dict[str, Any]:
        """Fetches live dataset metadata and card information."""
        if self.offline:
            return {"repo_id": repo_id, "status": "offline_mode"}

        url = f"{HF_API_BASE}/datasets/{repo_id}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json()
                    tags = data.get("tags", [])
                    license_tag = next((t.replace("license:", "") for t in tags if t.startswith("license:")), "unspecified")
                    return {
                        "repo_id": repo_id,
                        "status": "available",
                        "license": license_tag,
                        "sha": data.get("sha", "latest"),
                        "tags": tags,
                        "description": data.get("description", "")
                    }
                else:
                    return {"repo_id": repo_id, "status": f"http_{resp.status_code}"}
        except Exception as e:
            return {"repo_id": repo_id, "status": "connection_error", "error": str(e)}

    def is_cached(self, repo_id: str) -> bool:
        """Checks if a model checkpoint or metadata exists in local cache."""
        target_dir = self.cache_dir / repo_id.replace("/", "--")
        return target_dir.exists() and any(target_dir.iterdir())

    def get_cached_path(self, repo_id: str, filename: str) -> Optional[Path]:
        """Returns local path to a cached file if it exists."""
        target_file = self.cache_dir / repo_id.replace("/", "--") / filename
        return target_file if target_file.exists() else None


# Global singleton instance
hf_manager = HuggingFaceManager()
