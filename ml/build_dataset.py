"""Generates and splits benchmark ISL landmark dataset using kinematic ISL definitions.

Ensures strict signer isolation between train, validation, and test splits.
Provides authentic anatomically distinct hand configurations and movement trajectories
for all 15 core ISL classes, with full handedness invariance (Right and Left hand mirroring).
"""
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np

from ml.normalize import process_dual_hand_landmarks

ROOT_DIR = Path(__file__).resolve().parent.parent
VOCAB_PATH = ROOT_DIR / "data" / "vocabulary" / "isl_vocabulary.json"
DATA_DIR = ROOT_DIR / "data"


def load_vocabulary() -> List[Dict]:
    with open(VOCAB_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["signs"]


def create_base_hand_pose(
    pose_type: str = "open",
    hand: str = "Right",
    wrist_pos: Tuple[float, float, float] = (0.5, 0.7, 0.0),
    scale: float = 0.15,
) -> List[Dict[str, float]]:
    """Synthesizes an anatomically realistic 21-landmark hand configuration.

    Landmarks:
    0: Wrist
    1-4: Thumb (CMC, MCP, IP, TIP)
    5-8: Index (MCP, PIP, DIP, TIP)
    9-12: Middle (MCP, PIP, DIP, TIP)
    13-16: Ring (MCP, PIP, DIP, TIP)
    17-20: Pinky (MCP, PIP, DIP, TIP)
    """
    wx, wy, wz = wrist_pos
    landmarks = [{"x": wx, "y": wy, "z": wz}]  # Landmark 0: Wrist

    # Base finger spread angles for 5 fingers: Thumb, Index, Middle, Ring, Pinky
    # Spread varies depending on hand type
    if pose_type == "spread_5":
        finger_angles = [-0.75, -0.35, 0.0, 0.35, 0.75]
    elif pose_type in ("salute", "flat_b", "flat_chest", "flat_press"):
        finger_angles = [-0.55, -0.10, 0.0, 0.10, 0.20]  # Fingers closely together
    elif pose_type == "w_hand":
        finger_angles = [-0.60, -0.28, 0.0, 0.28, 0.55]  # W spread
    elif pose_type in ("pinch_snap", "no"):
        finger_angles = [-0.40, -0.15, -0.05, 0.25, 0.45]
    elif pose_type == "flat_o":
        finger_angles = [-0.30, -0.10, 0.0, 0.10, 0.25]
    elif pose_type in ("point_chest", "point_forward", "point_up"):
        finger_angles = [-0.45, -0.05, 0.15, 0.30, 0.45]
    else:  # fist, fist_a, fist_s
        finger_angles = [-0.40, -0.18, 0.0, 0.18, 0.36]

    if hand == "Left":
        finger_angles = [-a for a in finger_angles]

    for f_idx in range(5):
        base_angle = finger_angles[f_idx]
        cur_x, cur_y, cur_z = wx, wy, wz

        # Determine individual finger curling / extension based on pose type
        if f_idx == 0:  # Thumb
            if pose_type in ("fist_a", "fist"):
                curled = True
                thumb_tuck = 0.8  # Resting on side of index
            elif pose_type == "fist_s":
                curled = True
                thumb_tuck = 0.5  # Crossed over front of fingers
            elif pose_type in ("pinch_snap", "no", "flat_o"):
                curled = False
                thumb_tuck = 0.3  # Touching finger tips
            elif pose_type == "w_hand":
                curled = True
                thumb_tuck = 0.9  # Holding pinky
            elif pose_type in ("salute", "flat_b"):
                curled = False
                thumb_tuck = 0.7  # Folded close along palm
            else:
                curled = False
                thumb_tuck = 0.0
            mcp_dist = scale * 0.40
            seg_len = scale * 0.25

        elif f_idx == 1:  # Index
            if pose_type in ("fist", "fist_a", "fist_s"):
                curled = True
            elif pose_type == "flat_o":
                curled = True  # Pinched curve
            else:
                curled = False  # Extended for salute, spread, flat_b, point, w_hand, pinch_snap
            mcp_dist = scale * 0.55
            seg_len = scale * 0.28

        elif f_idx == 2:  # Middle
            if pose_type in ("fist", "fist_a", "fist_s", "point_chest", "point_forward", "point_up"):
                curled = True
            elif pose_type == "flat_o":
                curled = True
            else:
                curled = False  # Extended for salute, spread, flat_b, w_hand, pinch_snap
            mcp_dist = scale * 0.60
            seg_len = scale * 0.30

        elif f_idx == 3:  # Ring
            if pose_type in ("fist", "fist_a", "fist_s", "point_chest", "point_forward", "point_up", "pinch_snap", "no"):
                curled = True
            elif pose_type == "flat_o":
                curled = True
            elif pose_type == "w_hand":
                curled = False  # W-shape extends ring finger!
            else:
                curled = False  # Extended for salute, spread, flat_b, flat_chest
            mcp_dist = scale * 0.53
            seg_len = scale * 0.27

        else:  # Pinky (f_idx == 4)
            if pose_type in ("fist", "fist_a", "fist_s", "point_chest", "point_forward", "point_up", "pinch_snap", "no", "w_hand"):
                curled = True  # Pinky is curled for point, pinch, and w_hand!
            elif pose_type == "flat_o":
                curled = True
            else:
                curled = False  # Extended for salute, spread, flat_b, flat_chest
            mcp_dist = scale * 0.45
            seg_len = scale * 0.23

        # MCP Joint
        mcp_x = cur_x + np.sin(base_angle) * mcp_dist
        mcp_y = cur_y - np.cos(base_angle) * mcp_dist
        mcp_z = cur_z
        landmarks.append({"x": float(mcp_x), "y": float(mcp_y), "z": float(mcp_z)})

        # PIP, DIP, TIP
        cur_px, cur_py, cur_pz = mcp_x, mcp_y, mcp_z
        for seg in range(3):
            if curled:
                # Anatomical curling inward toward palm
                curl_in = 0.45 if pose_type == "flat_o" else 0.85
                cur_px += np.sin(base_angle) * (seg_len * 0.25)
                cur_py += np.cos(base_angle) * (seg_len * curl_in)
                cur_pz -= seg_len * 0.45
            else:
                # Anatomical extension outward
                cur_px += np.sin(base_angle) * seg_len
                cur_py -= np.cos(base_angle) * seg_len
                cur_pz += np.random.randn() * 0.005

            landmarks.append({"x": float(cur_px), "y": float(cur_py), "z": float(cur_pz)})

    return landmarks


def generate_sign_trajectory(
    label: str,
    sign_type: str,
    hands_count: int,
    signer_id: int,
    noise_level: float = 0.015,
    augment: bool = False,
    is_left_handed: bool = False,
) -> np.ndarray:
    """Generates a 30-frame normalized feature sequence (30, 148) for an ISL sign."""
    t = np.linspace(0, 1, 30)

    # Base signer anatomical offset with continuous variation
    if augment:
        signer_x_offset = float(np.random.uniform(-0.08, 0.12))
        signer_speed = float(np.random.uniform(0.85, 1.35))
        pose_scale = float(np.random.uniform(0.13, 0.17))
    else:
        signer_x_offset = (signer_id - 1) * 0.03
        signer_speed = 1.0 + (signer_id - 1) * 0.10
        pose_scale = 0.15

    dom_hand = "Left" if is_left_handed else "Right"
    dom_mult = -1.0 if is_left_handed else 1.0

    seq_features = []

    for frame_idx in range(30):
        progress = np.clip(t[frame_idx] * signer_speed, 0.0, 1.0)
        detected_hands = []

        if label == "HELLO":
            # Forehead salute arc: starts near temple, arcs outward and slightly down
            wx = 0.50 + dom_mult * (0.15 + progress * 0.18) + signer_x_offset
            wy = 0.32 - np.sin(progress * np.pi) * 0.06
            wz = -0.05 - progress * 0.08
            r_lm = create_base_hand_pose("salute", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "GOODBYE":
            # Hand raised at chest/shoulder waving horizontally side to side
            wave = np.sin(progress * 5 * np.pi) * 0.07
            wx = 0.50 + dom_mult * (0.15 + wave) + signer_x_offset
            wy = 0.42
            wz = 0.0
            r_lm = create_base_hand_pose("spread_5", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "THANK_YOU":
            # Chin to forward extension toward partner
            wx = 0.50 + signer_x_offset
            wy = 0.38 + progress * 0.16
            wz = -0.05 - progress * 0.20
            r_lm = create_base_hand_pose("flat_b", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "PLEASE":
            # Circular rubbing on chest
            angle = progress * 2.5 * np.pi
            wx = 0.50 + np.cos(angle) * 0.05 + signer_x_offset
            wy = 0.54 + np.sin(angle) * 0.05
            wz = 0.0
            r_lm = create_base_hand_pose("flat_chest", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "SORRY":
            # Circular fist motion on chest
            angle = progress * 2.5 * np.pi
            wx = 0.50 + np.cos(angle) * 0.045 + signer_x_offset
            wy = 0.54 + np.sin(angle) * 0.045
            wz = 0.0
            r_lm = create_base_hand_pose("fist_a", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "HELP":
            # Two hands: Left palm flat facing up, Right fist placed on it and lifted together
            lift = progress * 0.14
            l_lm = create_base_hand_pose("spread_5", "Left", (0.42 + signer_x_offset, 0.62 - lift, 0.0), scale=pose_scale)
            r_lm = create_base_hand_pose("fist_s", "Right", (0.44 + signer_x_offset, 0.59 - lift, -0.02), scale=pose_scale)
            detected_hands.append({"handedness": "Left", "landmarks": l_lm})
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "YES":
            # Fist nodding forward/downward
            nod = np.sin(progress * 3 * np.pi) * 0.05
            wx = 0.50 + dom_mult * 0.10 + signer_x_offset
            wy = 0.48 + nod
            wz = 0.0
            r_lm = create_base_hand_pose("fist_s", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "NO":
            # Index and middle finger horizontal pinch snap
            snap = np.sin(progress * 3 * np.pi) * 0.03
            wx = 0.50 + dom_mult * (0.12 + snap) + signer_x_offset
            wy = 0.48
            wz = 0.0
            r_lm = create_base_hand_pose("pinch_snap", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "WATER":
            # W-shape hand tapping near mouth
            tap = np.sin(progress * 4 * np.pi) * 0.02
            wx = 0.50 + dom_mult * (0.08 + tap) + signer_x_offset
            wy = 0.38
            wz = -0.05
            r_lm = create_base_hand_pose("w_hand", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "FOOD":
            # Flat-O brought repeatedly to mouth
            cycle = np.sin(progress * 2 * np.pi)
            wx = 0.50 + signer_x_offset
            wy = 0.46 - cycle * 0.08
            wz = -cycle * 0.08
            r_lm = create_base_hand_pose("flat_o", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "I":
            # Pointing inward to chest
            wx = 0.50 + signer_x_offset
            wy = 0.52
            wz = -0.05
            r_lm = create_base_hand_pose("point_chest", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "YOU":
            # Pointing forward toward partner
            wx = 0.50 + dom_mult * 0.06 + signer_x_offset
            wy = 0.48
            wz = -0.15 - progress * 0.08
            r_lm = create_base_hand_pose("point_forward", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "MY":
            # Flat open palm pressed flat on chest
            wx = 0.50 + signer_x_offset
            wy = 0.54
            wz = 0.0
            r_lm = create_base_hand_pose("flat_press", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        elif label == "WHAT":
            # Two hands palms up shaking side to side
            shake = np.sin(progress * 4 * np.pi) * 0.035
            l_lm = create_base_hand_pose("spread_5", "Left", (0.34 + shake + signer_x_offset, 0.56, 0.0), scale=pose_scale)
            r_lm = create_base_hand_pose("spread_5", "Right", (0.66 - shake + signer_x_offset, 0.56, 0.0), scale=pose_scale)
            detected_hands.append({"handedness": "Left", "landmarks": l_lm})
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "WHERE":
            # Index pointing up, pendulum wagging
            wag = np.sin(progress * 3 * np.pi) * 0.06
            wx = 0.50 + dom_mult * (0.12 + wag) + signer_x_offset
            wy = 0.40
            wz = 0.0
            r_lm = create_base_hand_pose("point_up", dom_hand, (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": dom_hand, "landmarks": r_lm})

        # Process frame to canonical 148 features
        _, engineered_148, _ = process_dual_hand_landmarks(detected_hands)

        # Inject realistic sensor jitter
        if noise_level > 0:
            noise = np.random.normal(0, noise_level, size=engineered_148.shape).astype(np.float32)
            # Do not corrupt binary presence flags at indices 146 and 147
            noise[146:] = 0.0
            engineered_148 = engineered_148 + noise

        seq_features.append(engineered_148)

    return np.array(seq_features, dtype=np.float32)


def build_and_split_dataset(
    train_per_class: int = 120,
    val_per_class: int = 30,
    test_per_class: int = 30
):
    """Builds balanced train/val/test splits with signer isolation and handedness augmentation."""
    print("=== Building ISL Landmark Dataset with Distinct Kinematics & Handedness Invariance ===")
    signs = load_vocabulary()
    num_classes = len(signs)
    print(f"Total vocabulary classes: {num_classes}")

    # Signers 1-3 for Train, Signer 4 for Validation, Signer 5 for Held-out Test
    splits = {
        "train": (DATA_DIR / "train", train_per_class, [1, 2, 3], True),
        "validation": (DATA_DIR / "validation", val_per_class, [4], False),
        "test": (DATA_DIR / "test", test_per_class, [5], False),
    }

    for split_name, (out_dir, n_samples, signers, is_aug) in splits.items():
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f"\nGenerating {split_name} split ({n_samples * num_classes} total samples)...")

        temporal_X, temporal_y = [], []
        static_X, static_y = [], []

        for sign in signs:
            s_id = sign["id"]
            label = sign["label"]
            stype = sign["type"]
            hands = sign["hands"]

            for i in range(n_samples):
                signer_id = signers[i % len(signers)]
                # Alternate left vs right hand for 1-handed signs to ensure mirror invariance
                is_left = (i % 2 == 1) if hands == 1 else False

                seq = generate_sign_trajectory(
                    label=label,
                    sign_type=stype,
                    hands_count=hands,
                    signer_id=signer_id,
                    noise_level=0.015 if not is_aug else 0.025,
                    augment=is_aug,
                    is_left_handed=is_left,
                )
                temporal_X.append(seq)
                temporal_y.append(s_id)

                # Static feature: representative midpoint frame
                mid_frame = seq[15]
                static_X.append(mid_frame)
                static_y.append(s_id)

        temporal_X_arr = np.array(temporal_X, dtype=np.float32)
        temporal_y_arr = np.array(temporal_y, dtype=np.int64)
        static_X_arr = np.array(static_X, dtype=np.float32)
        static_y_arr = np.array(static_y, dtype=np.int64)

        np.save(out_dir / "temporal_X.npy", temporal_X_arr)
        np.save(out_dir / "temporal_y.npy", temporal_y_arr)
        np.save(out_dir / "static_X.npy", static_X_arr)
        np.save(out_dir / "static_y.npy", static_y_arr)

        print(f"[{split_name.upper()}] Temporal: {temporal_X_arr.shape}, Static: {static_X_arr.shape}")

    print("\nDataset generation completed successfully.")


if __name__ == "__main__":
    build_and_split_dataset()
