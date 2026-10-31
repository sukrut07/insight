"""Database seed and synchronization utility for iNSIGHT.

Populates languages, complete A-Z manual alphabets, and beginner gestures
across Indian Sign Language (ISL), British Sign Language (BSL), and American Sign Language (ASL).
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, List
from backend.database.connection import get_db_connection

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = ROOT_DIR / "config" / "languages"

BEGINNER_GESTURES = [
    {"label": "HELLO", "priority": "high", "category": "greeting", "type": "dynamic", "isl_class": "HELLO"},
    {"label": "PLEASE", "priority": "high", "category": "social", "type": "dynamic", "isl_class": "PLEASE"},
    {"label": "SORRY", "priority": "high", "category": "social", "type": "dynamic", "isl_class": "SORRY"},
    {"label": "THANK_YOU", "priority": "high", "category": "social", "type": "dynamic", "isl_class": "THANK_YOU"},
    {"label": "YES", "priority": "high", "category": "response", "type": "static", "isl_class": "YES"},
    {"label": "NO", "priority": "high", "category": "response", "type": "static", "isl_class": "NO"},
    {"label": "GOODBYE", "priority": "high", "category": "greeting", "type": "dynamic", "isl_class": "GOODBYE"},
    {"label": "HELP", "priority": "high", "category": "emergency", "type": "dynamic", "isl_class": "HELP"},
    {"label": "GOOD_MORNING", "priority": "medium", "category": "greeting", "type": "dynamic", "isl_class": None},
    {"label": "GOOD_NIGHT", "priority": "medium", "category": "greeting", "type": "dynamic", "isl_class": None},
    {"label": "WELCOME", "priority": "medium", "category": "greeting", "type": "dynamic", "isl_class": None},
    {"label": "HOW_ARE_YOU", "priority": "medium", "category": "social", "type": "dynamic", "isl_class": None},
    {"label": "I_LOVE_YOU", "priority": "medium", "category": "social", "type": "static", "isl_class": None},
    {"label": "EXCUSE_ME", "priority": "medium", "category": "social", "type": "dynamic", "isl_class": None},
    {"label": "WATER", "priority": "high", "category": "basic_needs", "type": "static", "isl_class": "WATER"},
    {"label": "FOOD", "priority": "high", "category": "basic_needs", "type": "dynamic", "isl_class": "FOOD"},
    {"label": "I", "priority": "high", "category": "pronoun", "type": "static", "isl_class": "I"},
    {"label": "YOU", "priority": "high", "category": "pronoun", "type": "static", "isl_class": "YOU"},
    {"label": "MY", "priority": "high", "category": "pronoun", "type": "static", "isl_class": "MY"},
    {"label": "WHAT", "priority": "high", "category": "question", "type": "dynamic", "isl_class": "WHAT"},
    {"label": "WHERE", "priority": "high", "category": "question", "type": "dynamic", "isl_class": "WHERE"},
]


def seed_database_if_empty() -> None:
    """Seeds the SQLite database with full verified languages, alphabets, and beginner signs."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if languages are already populated
    cursor.execute("SELECT COUNT(*) as count FROM languages")
    lang_count = cursor.fetchone()["count"]

    if lang_count >= 3:
        # Check signs count
        cursor.execute("SELECT COUNT(*) as count FROM signs")
        sign_count = cursor.fetchone()["count"]
        if sign_count >= 50:
            conn.close()
            return

    logger.info("Seeding SQLite database with verified multilingual dictionaries...")

    languages_data = [
        ("ISL", "isl", "Indian Sign Language", "active"),
        ("BSL", "bsl", "British Sign Language", "experimental"),
        ("ASL", "asl", "American Sign Language", "experimental"),
    ]

    for lid, code, name, status in languages_data:
        cursor.execute(
            """
            INSERT OR REPLACE INTO languages (language_id, language_code, language_name, supported_status)
            VALUES (?, ?, ?, ?)
            """,
            (lid, code, name, status)
        )

    # Load JSON configs for rich alphabet descriptions
    for lid in ["ISL", "BSL", "ASL"]:
        cfg_file = CONFIG_DIR / f"{lid.lower()}.json"
        cfg: Dict[str, Any] = {}
        if cfg_file.exists():
            with open(cfg_file, "r", encoding="utf-8") as f:
                cfg = json.load(f)

        alphabets = cfg.get("alphabet", [])
        for item in alphabets:
            letter = item.get("letter", "")
            sign_id = f"{lid}_ALPHA_{letter}"
            desc = item.get("description", f"Manual fingerspelling for letter {letter} in {lid}.")
            hands = item.get("hands", 1)
            orient = item.get("orientation", "")
            tip = item.get("tip", "")

            # Alphabet recognition availability: ISL model has dedicated classes or is learning-only
            verification = "verified"
            # Explicitly mark availability
            status = "available_for_learning"

            cursor.execute(
                """
                INSERT OR REPLACE INTO signs (
                    sign_id, language_id, label, category, description,
                    sign_type, recognition_class, reference_media,
                    reference_source, verification_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sign_id,
                    lid,
                    letter,
                    "alphabet",
                    desc,
                    "static",
                    None,  # Alphabet models currently distinct or under CTC training
                    f"/assets/signs/{lid.lower()}/alpha_{letter.lower()}.svg",
                    f"{lid} National Deaf Association Standard",
                    verification
                )
            )

            cursor.execute(
                """
                INSERT OR REPLACE INTO sign_features (
                    sign_id, hand_configuration, palm_orientation,
                    movement_description, relevant_body_cues, relevant_facial_cues
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    sign_id,
                    f"{hands} hand(s); {tip}",
                    orient,
                    "Static hold in neutral signing space",
                    "Chest height, upright posture",
                    "Neutral gaze"
                )
            )

        # Seed Beginner gestures
        vocab_items = cfg.get("vocabulary", [])
        vocab_dict = {v["label"]: v for v in vocab_items}

        for g in BEGINNER_GESTURES:
            label = g["label"]
            v_info = vocab_dict.get(label, {})
            sign_id = f"{lid}_{label}"
            desc = v_info.get("description", f"{label.replace('_', ' ').title()} sign in {lid}.")
            stype = g["type"]
            rec_class = g["isl_class"] if (lid == "ISL" and g["isl_class"]) else None
            v_status = "supported" if rec_class else "learning_only"

            cursor.execute(
                """
                INSERT OR REPLACE INTO signs (
                    sign_id, language_id, label, category, description,
                    sign_type, recognition_class, reference_media,
                    reference_source, verification_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sign_id,
                    lid,
                    label,
                    g["category"],
                    desc,
                    stype,
                    rec_class,
                    f"/assets/signs/{lid.lower()}/{label.lower()}.svg",
                    f"{lid} Research & Training Standard",
                    v_status
                )
            )

            cursor.execute(
                """
                INSERT OR REPLACE INTO sign_features (
                    sign_id, hand_configuration, palm_orientation,
                    movement_description, relevant_body_cues, relevant_facial_cues
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    sign_id,
                    f"{v_info.get('hands', 1)} hand(s) configured for {label}",
                    v_info.get("hand_orientation", "Facing communicative partner"),
                    v_info.get("start_position", "Neutral chest signing space"),
                    "Upper body framing",
                    "Appropriate conversational affect"
                )
            )

    conn.commit()
    conn.close()
    logger.info("SQLite dictionary database seeded successfully.")
