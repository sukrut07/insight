"""SQLite database connection and schema initialization for SignBridge."""
import sqlite3
from typing import Generator
from backend.config import settings


def get_db_connection() -> sqlite3.Connection:
    settings.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(settings.DATABASE_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes SQLite tables for dictionary, recognition, and history."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS languages (
        language_id TEXT PRIMARY KEY,
        language_code TEXT NOT NULL UNIQUE,
        language_name TEXT NOT NULL,
        supported_status TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS signs (
        sign_id TEXT PRIMARY KEY,
        language_id TEXT NOT NULL,
        label TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        sign_type TEXT NOT NULL,
        recognition_class TEXT,
        reference_media TEXT,
        reference_source TEXT,
        verification_status TEXT NOT NULL,
        FOREIGN KEY (language_id) REFERENCES languages (language_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sign_features (
        feature_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sign_id TEXT NOT NULL,
        hand_configuration TEXT,
        palm_orientation TEXT,
        movement_description TEXT,
        relevant_body_cues TEXT,
        relevant_facial_cues TEXT,
        FOREIGN KEY (sign_id) REFERENCES signs (sign_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recognition_results (
        result_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        sign_id TEXT,
        confidence REAL NOT NULL,
        recognition_status TEXT NOT NULL,
        inference_latency REAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sign_id) REFERENCES signs (sign_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS translation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raw_tokens TEXT NOT NULL,
        refined_sentence TEXT NOT NULL,
        model_used TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sign_id TEXT,
        predicted_label TEXT NOT NULL,
        corrected_label TEXT NOT NULL,
        language_id TEXT DEFAULT 'ISL',
        confidence REAL NOT NULL,
        landmark_data TEXT NOT NULL,
        feedback_status TEXT DEFAULT 'pending',
        reviewed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

    # Seed dictionary data if empty
    try:
        from backend.database.seed_data import seed_database_if_empty
        seed_database_if_empty()
    except Exception as e:
        import logging
        logging.getLogger("signbridge.db").error("Failed to seed database: %s", e)
