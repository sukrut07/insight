"""Database query operations for translation history and user feedback."""
import json
import time
from typing import List, Dict, Any, Optional
from backend.database.connection import get_db_connection


def add_translation_history(raw_tokens: List[str], refined_sentence: str, model_used: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO translation_history (raw_tokens, refined_sentence, model_used) VALUES (?, ?, ?)",
        (json.dumps(raw_tokens), refined_sentence, model_used)
    )
    conn.commit()
    history_id = cursor.lastrowid
    conn.close()
    return history_id


def get_all_translation_history(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM translation_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "raw_tokens": json.loads(r["raw_tokens"]),
            "refined_sentence": r["refined_sentence"],
            "model_used": r["model_used"],
            "created_at": r["created_at"]
        }
        for r in rows
    ]


def delete_translation_history_item(history_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM translation_history WHERE id = ?", (history_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def add_user_feedback(
    predicted_label: str,
    corrected_label: str,
    confidence: float,
    landmark_data: Any
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO user_feedback (predicted_label, corrected_label, confidence, landmark_data)
        VALUES (?, ?, ?, ?)
        """,
        (predicted_label, corrected_label, confidence, json.dumps(landmark_data))
    )
    conn.commit()
    feedback_id = cursor.lastrowid
    conn.close()
    return feedback_id


def get_feedback_count() -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM user_feedback")
    count = cursor.fetchone()["count"]
    conn.close()
    return count
