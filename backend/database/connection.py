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
    """Initializes SQLite tables for translation history and correction feedback."""
    conn = get_db_connection()
    cursor = conn.cursor()

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
        predicted_label TEXT NOT NULL,
        corrected_label TEXT NOT NULL,
        confidence REAL NOT NULL,
        landmark_data TEXT NOT NULL,
        reviewed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()
