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


def get_signs_by_language(
    language_id: str = "ISL",
    category: Optional[str] = None,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieves all dictionary signs and their anatomical features for a language."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT
        s.sign_id, s.language_id, s.label, s.category, s.description,
        s.sign_type, s.recognition_class, s.reference_media,
        s.reference_source, s.verification_status,
        f.hand_configuration, f.palm_orientation, f.movement_description,
        f.relevant_body_cues, f.relevant_facial_cues
    FROM signs s
    LEFT JOIN sign_features f ON s.sign_id = f.sign_id
    WHERE s.language_id = ?
    """
    params = [language_id.upper()]

    if category and category != "all":
        query += " AND s.category = ?"
        params.append(category.lower())

    if search:
        query += " AND (s.label LIKE ? OR s.description LIKE ?)"
        term = f"%{search.strip().upper()}%"
        params.extend([term, f"%{search.strip()}%"])

    query += " ORDER BY CASE WHEN s.category = 'alphabet' THEN 0 ELSE 1 END, s.label ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "sign_id": r["sign_id"],
            "language_id": r["language_id"],
            "label": r["label"],
            "category": r["category"],
            "description": r["description"],
            "sign_type": r["sign_type"],
            "recognition_class": r["recognition_class"],
            "reference_media": r["reference_media"],
            "reference_source": r["reference_source"],
            "verification_status": r["verification_status"],
            "features": {
                "hand_configuration": r["hand_configuration"],
                "palm_orientation": r["palm_orientation"],
                "movement_description": r["movement_description"],
                "relevant_body_cues": r["relevant_body_cues"],
                "relevant_facial_cues": r["relevant_facial_cues"]
            }
        }
        for r in rows
    ]


def get_sign_detail(sign_id: str) -> Optional[Dict[str, Any]]:
    """Fetches comprehensive sign detail including feature and provenance data."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            s.*, f.hand_configuration, f.palm_orientation,
            f.movement_description, f.relevant_body_cues, f.relevant_facial_cues
        FROM signs s
        LEFT JOIN sign_features f ON s.sign_id = f.sign_id
        WHERE s.sign_id = ?
        """,
        (sign_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "sign_id": row["sign_id"],
        "language_id": row["language_id"],
        "label": row["label"],
        "category": row["category"],
        "description": row["description"],
        "sign_type": row["sign_type"],
        "recognition_class": row["recognition_class"],
        "reference_media": row["reference_media"],
        "reference_source": row["reference_source"],
        "verification_status": row["verification_status"],
        "features": {
            "hand_configuration": row["hand_configuration"],
            "palm_orientation": row["palm_orientation"],
            "movement_description": row["movement_description"],
            "relevant_body_cues": row["relevant_body_cues"],
            "relevant_facial_cues": row["relevant_facial_cues"]
        }
    }


def record_recognition_result(
    session_id: str,
    sign_id: Optional[str],
    confidence: float,
    recognition_status: str,
    inference_latency: float
) -> int:
    """Logs individual recognition predictions for transparency and session analytics."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO recognition_results (session_id, sign_id, confidence, recognition_status, inference_latency)
        VALUES (?, ?, ?, ?, ?)
        """,
        (session_id, sign_id, confidence, recognition_status, inference_latency)
    )
    conn.commit()
    res_id = cursor.lastrowid
    conn.close()
    return res_id


def get_dictionary_analytics(language_id: Optional[str] = None) -> Dict[str, Any]:
    """Calculates actual dictionary and coverage metrics directly from SQLite database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    base_filter = "WHERE language_id = ?" if language_id else ""
    params = [language_id.upper()] if language_id else []

    # Total entries
    cursor.execute(f"SELECT COUNT(*) as c FROM signs {base_filter}", params)
    total_entries = cursor.fetchone()["c"]

    # Alphabet available
    alpha_sql = f"SELECT COUNT(*) as c FROM signs WHERE category = 'alphabet'"
    if language_id:
        alpha_sql += " AND language_id = ?"
    cursor.execute(alpha_sql, params)
    alphabet_available = cursor.fetchone()["c"]

    # Alphabet verified
    alpha_ver_sql = f"SELECT COUNT(*) as c FROM signs WHERE category = 'alphabet' AND verification_status = 'verified'"
    if language_id:
        alpha_ver_sql += " AND language_id = ?"
    cursor.execute(alpha_ver_sql, params)
    alphabet_verified = cursor.fetchone()["c"]

    # Basic gestures available
    gesture_sql = f"SELECT COUNT(*) as c FROM signs WHERE category != 'alphabet'"
    if language_id:
        gesture_sql += " AND language_id = ?"
    cursor.execute(gesture_sql, params)
    basic_gestures_available = cursor.fetchone()["c"]

    # Recognition supported entries
    rec_sql = f"SELECT COUNT(*) as c FROM signs WHERE recognition_class IS NOT NULL"
    if language_id:
        rec_sql += " AND language_id = ?"
    cursor.execute(rec_sql, params)
    recognition_supported = cursor.fetchone()["c"]

    # Entries pending verification
    pend_sql = f"SELECT COUNT(*) as c FROM signs WHERE verification_status = 'pending_verification'"
    if language_id:
        pend_sql += " AND language_id = ?"
    cursor.execute(pend_sql, params)
    pending_verification = cursor.fetchone()["c"]

    conn.close()

    return {
        "language_id": language_id.upper() if language_id else "ALL",
        "total_dictionary_entries": total_entries,
        "alphabet_entries_available": alphabet_available,
        "alphabet_entries_verified": alphabet_verified,
        "basic_gestures_available": basic_gestures_available,
        "recognition_supported_entries": recognition_supported,
        "entries_pending_verification": pending_verification
    }


def get_platform_kpis(active_language: str = "ISL") -> Dict[str, Any]:
    """Computes transparent platform-level KPI card metrics for the landing page."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Languages count
    cursor.execute("SELECT COUNT(*) as c FROM languages WHERE supported_status IN ('active', 'supported', 'experimental')")
    supported_languages_count = cursor.fetchone()["c"]

    # 2. Dictionary coverage (total verified entries)
    cursor.execute("SELECT COUNT(*) as c FROM signs WHERE verification_status = 'verified'")
    verified_dictionary_coverage = cursor.fetchone()["c"]

    # 3. Alphabet coverage for active language (out of 26)
    cursor.execute(
        "SELECT COUNT(*) as c FROM signs WHERE language_id = ? AND category = 'alphabet'",
        (active_language.upper(),)
    )
    alphabet_available_active = cursor.fetchone()["c"]

    # 4. Recognition classes supported by active model
    cursor.execute(
        "SELECT COUNT(*) as c FROM signs WHERE language_id = ? AND recognition_class IS NOT NULL",
        (active_language.upper(),)
    )
    recognition_classes_count = cursor.fetchone()["c"]

    conn.close()

    return {
        "supported_languages": supported_languages_count,
        "dictionary_coverage": verified_dictionary_coverage,
        "alphabet_coverage": {
            "available": alphabet_available_active,
            "target": 26,
            "language": active_language.upper()
        },
        "recognition_classes": recognition_classes_count,
        "active_language": active_language.upper()
    }
