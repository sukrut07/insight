"""Landmark normalization and spatial alignment utilities for SignBridge.

Handles wrist-centric translation, scale invariance, and explicit padding
for missing hands.
"""
from typing import List, Dict, Any, Tuple, Optional
import numpy as np


NUM_LANDMARKS_PER_HAND = 21
COORDINATES_PER_LANDMARK = 3  # (x, y, z)
HAND_FEATURE_DIM = NUM_LANDMARKS_PER_HAND * COORDINATES_PER_LANDMARK  # 63
TOTAL_RAW_LANDMARK_DIM = HAND_FEATURE_DIM * 2  # 126 (2 hands: Left, Right)


def normalize_hand_landmarks(
    landmarks_xyz: np.ndarray
) -> Tuple[np.ndarray, float]:
    """Normalizes 21 3D landmarks for a single hand.

    1. Translates all landmarks so wrist (landmark 0) is at origin (0, 0, 0).
    2. Scales landmarks by the Euclidean distance between wrist (0) and
       middle finger base MCP joint (9).

    Args:
        landmarks_xyz: Array of shape (21, 3)

    Returns:
        normalized_xyz: Array of shape (21, 3)
        scale: float scaling factor
    """
    if landmarks_xyz.shape != (21, 3):
        raise ValueError(f"Expected shape (21, 3), got {landmarks_xyz.shape}")

    # Step 1: Wrist translation
    wrist = landmarks_xyz[0, :].copy()
    translated = landmarks_xyz - wrist

    # Step 2: Scale calculation (Wrist to Middle MCP index 9)
    middle_mcp = translated[9, :]
    scale = float(np.linalg.norm(middle_mcp))

    if scale < 1e-6:
        # Prevent division by zero if hand is degenerate
        scale = 1.0

    normalized = translated / scale
    return normalized, scale


def compute_finger_joint_angles(landmarks_xyz: np.ndarray) -> np.ndarray:
    """Computes joint flexion angles for thumb and four fingers.

    For each finger, computes the angle at PIP (Proximal Interphalangeal)
    and DIP (Distal Interphalangeal) joints.
    5 fingers * 2 angles = 10 angular features.

    Args:
        landmarks_xyz: Array of shape (21, 3)

    Returns:
        angles: Array of shape (10,) with angles in radians [0, pi]
    """
    # Finger joint index triplets (base, middle, tip)
    finger_triplets = [
        # Thumb: MCP(2), IP(3), TIP(4)
        (1, 2, 3), (2, 3, 4),
        # Index: MCP(5), PIP(6), DIP(7), TIP(8)
        (5, 6, 7), (6, 7, 8),
        # Middle: MCP(9), PIP(10), DIP(11), TIP(12)
        (9, 10, 11), (10, 11, 12),
        # Ring: MCP(13), PIP(14), DIP(15), TIP(16)
        (13, 14, 15), (14, 15, 16),
        # Pinky: MCP(17), PIP(18), DIP(19), TIP(20)
        (17, 18, 19), (18, 19, 20),
    ]

    angles = []
    for a_idx, b_idx, c_idx in finger_triplets:
        a = landmarks_xyz[a_idx]
        b = landmarks_xyz[b_idx]
        c = landmarks_xyz[c_idx]

        v1 = a - b
        v2 = c - b

        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 < 1e-6 or norm2 < 1e-6:
            angles.append(0.0)
        else:
            cosine = np.dot(v1, v2) / (norm1 * norm2)
            cosine = np.clip(cosine, -1.0, 1.0)
            angles.append(float(np.arccos(cosine)))

    return np.array(angles, dtype=np.float32)


def process_dual_hand_landmarks(
    detected_hands: List[Dict[str, Any]]
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """Standardizes dual-hand detection into a fixed 126-dim coordinate vector

    plus engineered features and presence masks.

    Left hand occupies indices [0:63], Right hand occupies indices [63:126].
    If a hand is missing, it is populated with zeros and marked in the mask.

    Args:
        detected_hands: List of dicts, each containing:
            - 'handedness': 'Left' or 'Right'
            - 'landmarks': List of 21 dicts with 'x', 'y', 'z'

    Returns:
        raw_coords_126: Shape (126,) float32
        engineered_features: Shape (126 + 20 + 2 = 148,) float32
        metadata: Dict with hand counts and handedness
    """
    left_hand_xyz = np.zeros((21, 3), dtype=np.float32)
    right_hand_xyz = np.zeros((21, 3), dtype=np.float32)
    left_present = 0.0
    right_present = 0.0

    for hand in detected_hands:
        handedness = hand.get("handedness", "Right")
        lm_list = hand.get("landmarks", [])
        if len(lm_list) != 21:
            continue

        arr = np.array([[lm["x"], lm["y"], lm["z"]] for lm in lm_list], dtype=np.float32)

        if handedness == "Left":
            left_hand_xyz = arr
            left_present = 1.0
        else:
            right_hand_xyz = arr
            right_present = 1.0

    # Raw 126 coords
    raw_coords_126 = np.concatenate([
        left_hand_xyz.flatten(),
        right_hand_xyz.flatten()
    ]).astype(np.float32)

    # Normalize each present hand
    norm_left = np.zeros((21, 3), dtype=np.float32)
    angles_left = np.zeros((10,), dtype=np.float32)
    if left_present > 0.5:
        norm_left, _ = normalize_hand_landmarks(left_hand_xyz)
        angles_left = compute_finger_joint_angles(norm_left)

    norm_right = np.zeros((21, 3), dtype=np.float32)
    angles_right = np.zeros((10,), dtype=np.float32)
    if right_present > 0.5:
        norm_right, _ = normalize_hand_landmarks(right_hand_xyz)
        angles_right = compute_finger_joint_angles(norm_right)

    # Combine: 126 normalized coords + 20 angles + 2 presence flags = 148 features
    engineered_features = np.concatenate([
        norm_left.flatten(),
        norm_right.flatten(),
        angles_left,
        angles_right,
        np.array([left_present, right_present], dtype=np.float32)
    ]).astype(np.float32)

    metadata = {
        "hand_count": int(left_present + right_present),
        "left_detected": bool(left_present),
        "right_detected": bool(right_present)
    }

    return raw_coords_126, engineered_features, metadata
