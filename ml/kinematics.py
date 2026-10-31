"""Kinematic and Anatomical Sign Language Classification Engine.

Implements linguistically validated handshape, spatial location (tabula),
orientation, and multi-hand kinematic rules for ISL, BSL, and ASL according to
standard sign language phonology (Stokoe / ISLRTC / BSL / ASL-Citizen standards).

Prevents out-of-distribution gestures and relaxed hand poses from falsely
collapsing into 'FOOD'.
"""
from typing import List, Dict, Any, Tuple, Optional
import numpy as np


def analyze_hand_landmarks(landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
    """Extracts invariant anatomical metrics from 21 MediaPipe hand landmarks."""
    if len(landmarks) != 21:
        return {}

    w = np.array([landmarks[0]["x"], landmarks[0]["y"], landmarks[0]["z"]], dtype=np.float32)

    tips = [4, 8, 12, 16, 20]
    mcps = [2, 5, 9, 13, 17]

    # Hand scale: Euclidean distance from wrist to middle finger MCP (landmark 9)
    middle_mcp = np.array([landmarks[9]["x"], landmarks[9]["y"], landmarks[9]["z"]], dtype=np.float32)
    scale = float(np.linalg.norm(middle_mcp - w))
    scale = max(scale, 1e-4)

    # 4 fingers extension: Index, Middle, Ring, Pinky
    ext_4 = []
    for t_idx, m_idx in zip(tips[1:], mcps[1:]):
        t = np.array([landmarks[t_idx]["x"], landmarks[t_idx]["y"], landmarks[t_idx]["z"]], dtype=np.float32)
        m = np.array([landmarks[m_idx]["x"], landmarks[m_idx]["y"], landmarks[m_idx]["z"]], dtype=np.float32)
        dist_tip = float(np.linalg.norm(t - w))
        dist_mcp = float(np.linalg.norm(m - w))
        ext_4.append(bool(dist_tip > dist_mcp * 1.25))

    t_tip = np.array([landmarks[4]["x"], landmarks[4]["y"], landmarks[4]["z"]], dtype=np.float32)
    i_tip = np.array([landmarks[8]["x"], landmarks[8]["y"], landmarks[8]["z"]], dtype=np.float32)
    m_tip = np.array([landmarks[12]["x"], landmarks[12]["y"], landmarks[12]["z"]], dtype=np.float32)
    r_tip = np.array([landmarks[16]["x"], landmarks[16]["y"], landmarks[16]["z"]], dtype=np.float32)
    p_tip = np.array([landmarks[20]["x"], landmarks[20]["y"], landmarks[20]["z"]], dtype=np.float32)

    d_thumb = float(np.linalg.norm(t_tip - w)) / scale
    spread = (
        float(np.linalg.norm(i_tip - m_tip)) +
        float(np.linalg.norm(m_tip - r_tip)) +
        float(np.linalg.norm(r_tip - p_tip))
    ) / (3.0 * scale)

    dist_thumb_index = float(np.linalg.norm(t_tip - i_tip)) / scale
    dist_thumb_middle = float(np.linalg.norm(t_tip - m_tip)) / scale

    # Classify basic handshape
    # 1. Closed fist vs flat-O
    if sum(ext_4) == 0:
        shape = "FIST" if d_thumb < 1.10 else "FLAT_O"
    # 2. W-hand (Index, Middle, Ring extended; Pinky curled)
    elif ext_4 == [True, True, True, False]:
        shape = "W_HAND"
    # 3. Single index pointing (Index extended; Middle, Ring, Pinky curled)
    elif ext_4 == [True, False, False, False]:
        shape = "POINT_INDEX"
    # 4. Two fingers (Index and Middle extended)
    elif ext_4 == [True, True, False, False]:
        shape = "PINCH_SNAP"
    # 5. Open palms (3 or 4 fingers extended)
    elif sum(ext_4) >= 3:
        shape = "SPREAD_5" if spread > 0.55 else "FLAT_PALM"
    else:
        shape = "OTHER"

    # Index pointing vector (wrist to index tip)
    idx_vec = i_tip - w
    idx_len = np.linalg.norm(idx_vec)
    if idx_len > 1e-6:
        idx_vec = idx_vec / idx_len

    return {
        "wrist": w,
        "wrist_x": float(w[0]),
        "wrist_y": float(w[1]),
        "wrist_z": float(w[2]),
        "scale": scale,
        "ext_4": ext_4,
        "shape": shape,
        "d_thumb": d_thumb,
        "spread": spread,
        "dist_thumb_index": dist_thumb_index,
        "dist_thumb_middle": dist_thumb_middle,
        "index_vector": idx_vec,
        "index_tip_y": float(i_tip[1]),
        "index_tip_z": float(i_tip[2]),
    }


def classify_isl_kinematics(detected_hands: List[Dict[str, Any]]) -> Tuple[str, float]:
    """Evaluates 15 core ISL classes based on physical kinematics, location, and finger topology."""
    if not detected_hands:
        return "NONE", 1.0

    valid_hands = [h for h in detected_hands if len(h.get("landmarks", [])) == 21]
    if not valid_hands:
        return "NONE", 1.0

    num_hands = len(valid_hands)
    h0 = analyze_hand_landmarks(valid_hands[0]["landmarks"])
    h1 = analyze_hand_landmarks(valid_hands[1]["landmarks"]) if num_hands >= 2 else None

    # =========================================================================
    # TWO-HANDED ISL SIGNS (HELP, WHAT)
    # =========================================================================
    if num_hands >= 2 and h0 and h1:
        # HELP: Non-dominant palm flat facing up, dominant fist placed on it and lifted
        is_flat_and_fist = (
            (h0["shape"] in ("FLAT_PALM", "SPREAD_5") and h1["shape"] == "FIST") or
            (h1["shape"] in ("FLAT_PALM", "SPREAD_5") and h0["shape"] == "FIST")
        )
        hand_dist = np.linalg.norm(h0["wrist"] - h1["wrist"])
        if is_flat_and_fist and hand_dist < 0.45:
            return "HELP", 0.95

        # WHAT: Both hands open palms facing up, held apart at waist/chest level
        both_open = h0["shape"] in ("FLAT_PALM", "SPREAD_5") and h1["shape"] in ("FLAT_PALM", "SPREAD_5")
        hands_apart = abs(h0["wrist_x"] - h1["wrist_x"]) > 0.16
        at_chest_or_waist = h0["wrist_y"] > 0.42 and h1["wrist_y"] > 0.42
        if both_open and hands_apart and at_chest_or_waist:
            return "WHAT", 0.94

    # =========================================================================
    # SINGLE-HANDED ISL SIGNS (Dominant Hand)
    # =========================================================================
    dom = h0
    if h1 and h1["wrist_y"] < h0["wrist_y"]:
        dom = h1

    wy = dom["wrist_y"]
    wx = dom["wrist_x"]
    shape = dom["shape"]
    idx_vec = dom["index_vector"]

    # 1. WATER: W-handshape near chin / mouth
    if shape == "W_HAND":
        if wy < 0.58:
            return "WATER", 0.95
        return "WATER", 0.88

    # 2. NO: Index and middle fingers snapping / pinching against thumb
    if shape == "PINCH_SNAP":
        return "NO", 0.94

    # 3. FOOD: Flattened O-shape hand strictly near mouth / chin (wy <= 0.48)
    # CRITICAL: Only triggers when hand is brought up to mouth!
    if shape == "FLAT_O":
        if wy <= 0.48:
            return "FOOD", 0.94
        # If hand is down at chest or waist, it is NOT food
        return "UNKNOWN", 0.30

    # 4. SINGLE FINGER POINTING (I, YOU, WHERE)
    if shape == "POINT_INDEX":
        # WHERE: Index pointing straight UP
        if idx_vec[1] < -0.35 or dom["index_tip_y"] < (wy - 0.08):
            return "WHERE", 0.93

        # I: Pointing inward toward chest
        if wy >= 0.46 and (dom["index_tip_z"] < dom["wrist_z"] - 0.02 or abs(wx - 0.5) < 0.15):
            return "I", 0.90

        # YOU: Pointing forward toward partner/camera
        if 0.38 <= wy <= 0.65:
            return "YOU", 0.88

        return "I", 0.80

    # 5. CLOSED FIST SIGNS (YES, SORRY)
    if shape == "FIST":
        # SORRY: Fist held firmly over the center chest / heart area (wy > 0.48)
        if wy > 0.48:
            return "SORRY", 0.92

        # YES: Upright fist held in neutral / chin space (wy <= 0.50), nodding affirmative
        return "YES", 0.91

    # 6. SPREAD 5 (GOODBYE)
    if shape == "SPREAD_5":
        # GOODBYE: Open hand raised waving side to side
        if 0.30 <= wy <= 0.65:
            return "GOODBYE", 0.93

    # 7. FLAT PALM (HELLO, THANK_YOU, PLEASE, MY)
    if shape == "FLAT_PALM":
        # HELLO: Flat hand placed near temple / forehead (wy < 0.40) in a salute
        if wy < 0.40:
            return "HELLO", 0.93

        # THANK_YOU: Flat hand near chin / mouth (0.38 <= wy <= 0.48) moving forward
        if 0.38 <= wy <= 0.48:
            return "THANK_YOU", 0.92

        # PLEASE / MY: Flat hand placed flat on the chest (wy > 0.48)
        if wy > 0.48:
            if abs(wx - 0.5) < 0.20:
                return "PLEASE", 0.92
            return "MY", 0.88

    return "UNKNOWN", 0.35


def classify_bsl_kinematics(detected_hands: List[Dict[str, Any]]) -> Tuple[str, float]:
    """Evaluates 8 core BSL classes (HELLO, GOODBYE, THANK_YOU, PLEASE, HELP, NAME, YES, NO)."""
    if not detected_hands:
        return "NONE", 1.0

    valid_hands = [h for h in detected_hands if len(h.get("landmarks", [])) == 21]
    if not valid_hands:
        return "NONE", 1.0

    num_hands = len(valid_hands)
    h0 = analyze_hand_landmarks(valid_hands[0]["landmarks"])
    h1 = analyze_hand_landmarks(valid_hands[1]["landmarks"]) if num_hands >= 2 else None

    # BSL HELP: Two hands - non-dominant palm flat facing up, dominant hand on it lifting
    if num_hands >= 2 and h0 and h1:
        is_flat_and_fist = (
            (h0["shape"] in ("FLAT_PALM", "SPREAD_5") and h1["shape"] in ("FIST", "FLAT_PALM")) or
            (h1["shape"] in ("FLAT_PALM", "SPREAD_5") and h0["shape"] in ("FIST", "FLAT_PALM"))
        )
        if is_flat_and_fist and np.linalg.norm(h0["wrist"] - h1["wrist"]) < 0.45:
            return "HELP", 0.95

    dom = h0
    if h1 and h1["wrist_y"] < h0["wrist_y"]:
        dom = h1

    wy = dom["wrist_y"]
    shape = dom["shape"]

    # NAME: Two fingers (Index + Middle) extended together, tapping
    if shape == "PINCH_SNAP" and dom["spread"] < 0.45:
        return "NAME", 0.92

    # NO: Two fingers snapping against thumb
    if shape == "PINCH_SNAP":
        return "NO", 0.93

    # YES: Closed fist nodding in neutral space
    if shape == "FIST":
        return "YES", 0.91

    # SPREAD 5 (GOODBYE)
    if shape == "SPREAD_5" and 0.30 <= wy <= 0.65:
        return "GOODBYE", 0.93

    # FLAT PALM (HELLO, THANK_YOU, PLEASE)
    if shape in ("FLAT_PALM", "SPREAD_5"):
        if wy < 0.40:
            return "HELLO", 0.93
        if 0.38 <= wy <= 0.48:
            return "THANK_YOU", 0.92
        if wy > 0.48:
            return "PLEASE", 0.91

    return "UNKNOWN", 0.35


def classify_asl_kinematics(detected_hands: List[Dict[str, Any]]) -> Tuple[str, float]:
    """Evaluates 8 core ASL classes (HELLO, THANK_YOU, PLEASE, HELP, YES, NO, WANT, NEED)."""
    if not detected_hands:
        return "NONE", 1.0

    valid_hands = [h for h in detected_hands if len(h.get("landmarks", [])) == 21]
    if not valid_hands:
        return "NONE", 1.0

    num_hands = len(valid_hands)
    h0 = analyze_hand_landmarks(valid_hands[0]["landmarks"])
    h1 = analyze_hand_landmarks(valid_hands[1]["landmarks"]) if num_hands >= 2 else None

    # ASL HELP: Non-dominant flat palm up, dominant A-fist lifted on it
    if num_hands >= 2 and h0 and h1:
        is_flat_and_fist = (
            (h0["shape"] in ("FLAT_PALM", "SPREAD_5") and h1["shape"] == "FIST") or
            (h1["shape"] in ("FLAT_PALM", "SPREAD_5") and h0["shape"] == "FIST")
        )
        if is_flat_and_fist and np.linalg.norm(h0["wrist"] - h1["wrist"]) < 0.45:
            return "HELP", 0.95

    dom = h0
    if h1 and h1["wrist_y"] < h0["wrist_y"]:
        dom = h1

    wy = dom["wrist_y"]
    shape = dom["shape"]
    idx_vec = dom["index_vector"]

    # NO: ASL 3-finger snap (Index and middle snap down to meet thumb)
    if shape == "PINCH_SNAP":
        return "NO", 0.94

    # NEED: Bent/hooked index finger (X-hand) bending downward
    if shape == "POINT_INDEX":
        if idx_vec[1] > 0.10:  # pointing downward
            return "NEED", 0.91

    # WANT: Claw hand (all 5 fingers curved/clawed pulling inward at waist/chest)
    if shape == "OTHER" and 0.45 <= wy <= 0.68 and dom["spread"] > 0.40:
        return "WANT", 0.89

    # YES: 'S' fist held upright nodding forward
    if shape == "FIST":
        return "YES", 0.92

    # OPEN / FLAT PALM (HELLO, THANK_YOU, PLEASE)
    if shape in ("FLAT_PALM", "SPREAD_5"):
        if wy < 0.40:
            return "HELLO", 0.93
        if 0.38 <= wy <= 0.48:
            return "THANK_YOU", 0.92
        if wy > 0.48:
            return "PLEASE", 0.91

    return "UNKNOWN", 0.35


def classify_gesture(
    language: str,
    detected_hands: List[Dict[str, Any]]
) -> Tuple[str, float]:
    """Routes to the dedicated kinematic classifier for the given language."""
    lang_upper = (language or "ISL").strip().upper()
    if lang_upper == "BSL":
        return classify_bsl_kinematics(detected_hands)
    elif lang_upper == "ASL":
        return classify_asl_kinematics(detected_hands)
    else:
        return classify_isl_kinematics(detected_hands)
