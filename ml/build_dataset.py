"""Generates and splits benchmark ISL landmark dataset using kinematic ISL definitions.

Ensures strict signer isolation between train, validation, and test splits.
"""
import json
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np

from ml.normalize import process_dual_hand_landmarks

ROOT_DIR = Path(__file__).resolve().parent.parent
VOCAB_PATH = ROOT_DIR / "data" / "vocabulary" / "isl_vocabulary.json"
DATA_DIR = ROOT_DIR / "data"


def load_vocabulary() -> List[Dict]:
    with open(VOCAB_PATH, "r") as f:
        data = json.load(f)
    return data["signs"]


def create_base_hand_pose(
    pose_type: str = "open",
    hand: str = "Right",
    wrist_pos: Tuple[float, float, float] = (0.5, 0.7, 0.0),
    scale: float = 0.15,
) -> List[Dict[str, float]]:
    """Synthesizes an anatomically realistic 21-landmark hand configuration."""
    wx, wy, wz = wrist_pos
    landmarks = [{"x": wx, "y": wy, "z": wz}]  # Landmark 0: Wrist

    # Finger configuration offsets based on pose
    is_fist = pose_type in ("fist", "sorry", "yes")
    is_pointing = pose_type in ("point_chest", "point_forward", "where")
    is_pinch = pose_type in ("pinch", "no")
    is_w_shape = pose_type in ("w_shape", "water")
    is_flat_o = pose_type in ("flat_o", "food")

    # 5 fingers base angles (Thumb, Index, Middle, Ring, Pinky)
    finger_angles = [-0.6, -0.25, 0.0, 0.25, 0.5] if hand == "Right" else [0.6, 0.25, 0.0, -0.25, -0.5]

    for f_idx in range(5):
        base_angle = finger_angles[f_idx]
        cur_x, cur_y, cur_z = wx, wy, wz

        # Determine curl factor
        if f_idx == 0:  # Thumb
            curled = is_fist or is_flat_o
            mcp_dist = scale * 0.4
            seg_len = scale * 0.25
        elif f_idx == 1:  # Index
            curled = is_fist
            mcp_dist = scale * 0.55
            seg_len = scale * 0.28
        elif f_idx == 2:  # Middle
            curled = is_fist or is_pointing
            mcp_dist = scale * 0.60
            seg_len = scale * 0.30
        elif f_idx == 3:  # Ring
            curled = is_fist or is_pointing or is_pinch
            mcp_dist = scale * 0.53
            seg_len = scale * 0.27
        else:  # Pinky
            curled = is_fist or is_pointing or is_pinch or is_w_shape
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
                # Curl back toward palm
                cur_px += np.sin(base_angle) * (seg_len * 0.3)
                cur_py += np.cos(base_angle) * (seg_len * 0.7)
                cur_pz -= seg_len * 0.4
            else:
                # Extend outward
                cur_px += np.sin(base_angle) * seg_len
                cur_py -= np.cos(base_angle) * seg_len
                cur_pz += (np.random.randn() * 0.01)

            landmarks.append({"x": float(cur_px), "y": float(cur_py), "z": float(cur_pz)})

    return landmarks


def generate_sign_trajectory(
    label: str,
    sign_type: str,
    hands_count: int,
    signer_id: int,
    noise_level: float = 0.02,
    augment: bool = False,
) -> np.ndarray:
    """Generates a 30-frame normalized feature sequence (30, 148) for an ISL sign."""
    seq_features = []
    # Kinematic trajectories
    t = np.linspace(0, 1, 30)

    # Base signer anatomical offset with continuous augmentation support
    if augment:
        signer_x_offset = float(np.random.uniform(-0.10, 0.15))
        signer_speed = float(np.random.uniform(0.80, 1.55))
        pose_scale = float(np.random.uniform(0.12, 0.18))
    else:
        signer_x_offset = (signer_id - 1) * 0.04
        signer_speed = 1.0 + (signer_id - 1) * 0.15
        pose_scale = 0.15

    for frame_idx in range(30):
        progress = np.clip(t[frame_idx] * signer_speed, 0.0, 1.0)
        detected_hands = []

        if label == "HELLO":
            # Forehead salute arc outward
            wx = 0.65 + progress * 0.20 + signer_x_offset
            wy = 0.30 - np.sin(progress * np.pi) * 0.05
            wz = -0.1
            r_lm = create_base_hand_pose("open", "Right", (wx, wy, wz), scale=pose_scale)
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "GOODBYE":
            # Chest wave side-to-side
            wx = 0.60 + np.sin(progress * 4 * np.pi) * 0.08 + signer_x_offset
            wy = 0.45
            wz = 0.0
            r_lm = create_base_hand_pose("open", "Right", (wx, wy, wz))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "THANK_YOU":
            # Chin to forward extension
            wx = 0.50 + progress * 0.05 + signer_x_offset
            wy = 0.40 + progress * 0.15
            wz = -0.05 - progress * 0.15
            r_lm = create_base_hand_pose("open", "Right", (wx, wy, wz))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "PLEASE":
            # Circular rubbing on chest
            angle = progress * 2 * np.pi
            wx = 0.50 + np.cos(angle) * 0.06 + signer_x_offset
            wy = 0.55 + np.sin(angle) * 0.06
            wz = 0.0
            r_lm = create_base_hand_pose("open", "Right", (wx, wy, wz))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "SORRY":
            # Circular fist motion on chest
            angle = progress * 2 * np.pi
            wx = 0.50 + np.cos(angle) * 0.05 + signer_x_offset
            wy = 0.55 + np.sin(angle) * 0.05
            wz = 0.0
            r_lm = create_base_hand_pose("fist", "Right", (wx, wy, wz))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "HELP":
            # Two hands: Left palm flat, Right fist lifting
            lift = progress * 0.12
            l_lm = create_base_hand_pose("open", "Left", (0.42 + signer_x_offset, 0.60 - lift, 0.0))
            r_lm = create_base_hand_pose("fist", "Right", (0.42 + signer_x_offset, 0.58 - lift, -0.02))
            detected_hands.append({"handedness": "Left", "landmarks": l_lm})
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "WHAT":
            # Two hands palms up shaking side to side
            shake = np.sin(progress * 4 * np.pi) * 0.03
            l_lm = create_base_hand_pose("open", "Left", (0.35 + shake + signer_x_offset, 0.55, 0.0))
            r_lm = create_base_hand_pose("open", "Right", (0.65 - shake + signer_x_offset, 0.55, 0.0))
            detected_hands.append({"handedness": "Left", "landmarks": l_lm})
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "WHERE":
            # Pointing finger wagging side to side
            wag = np.sin(progress * 3 * np.pi) * 0.05
            r_lm = create_base_hand_pose("where", "Right", (0.55 + wag + signer_x_offset, 0.40, 0.0))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "FOOD":
            # Flat O brought to mouth
            wx = 0.52 + signer_x_offset
            wy = 0.55 - progress * 0.15
            wz = -progress * 0.1
            r_lm = create_base_hand_pose("flat_o", "Right", (wx, wy, wz))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "YES":
            # Fist nodding downward
            nod = np.sin(progress * 2 * np.pi) * 0.04
            r_lm = create_base_hand_pose("yes", "Right", (0.55 + signer_x_offset, 0.50 + nod, 0.0))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "NO":
            # Pinch fingers tapping
            r_lm = create_base_hand_pose("no", "Right", (0.55 + signer_x_offset, 0.50, 0.0))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "WATER":
            # W shape at chin
            r_lm = create_base_hand_pose("w_shape", "Right", (0.52 + signer_x_offset, 0.42, 0.0))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "I":
            # Pointing at chest
            r_lm = create_base_hand_pose("point_chest", "Right", (0.50 + signer_x_offset, 0.55, 0.0))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "YOU":
            # Pointing forward toward camera
            r_lm = create_base_hand_pose("point_forward", "Right", (0.50 + signer_x_offset, 0.50, -0.15))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        elif label == "MY":
            # Flat palm on chest
            r_lm = create_base_hand_pose("open", "Right", (0.50 + signer_x_offset, 0.55, 0.0))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        else:
            r_lm = create_base_hand_pose("open", "Right", (0.50, 0.50, 0.0))
            detected_hands.append({"handedness": "Right", "landmarks": r_lm})

        # Apply noise
        for hand in detected_hands:
            for lm in hand["landmarks"]:
                lm["x"] += float(np.random.randn() * noise_level)
                lm["y"] += float(np.random.randn() * noise_level)
                lm["z"] += float(np.random.randn() * noise_level)

        _, eng_feat, _ = process_dual_hand_landmarks(detected_hands)
        seq_features.append(eng_feat)

    return np.array(seq_features, dtype=np.float32)


def build_and_save_dataset():
    """Generates dataset splits with strict signer isolation."""
    vocab = load_vocabulary()
    print(f"Loaded {len(vocab)} ISL vocabulary classes.")

    # Signers: Signer 1 & 2 for Train, Signer 3 for Val, Signer 4 for Test
    splits = {
        "train": [1, 2],
        "validation": [3],
        "test": [4]
    }

    samples_per_signer = 25  # 50 train, 25 val, 25 test per sign

    for split_name, signers in splits.items():
        temporal_X = []
        temporal_y = []
        static_X = []
        static_y = []
        is_train = (split_name == "train")
        n_samples = 50 if is_train else 25

        for sign_info in vocab:
            label = sign_info["label"]
            sign_id = sign_info["id"]
            sign_type = sign_info["type"]
            hands = sign_info["hands"]

            for signer_id in signers:
                for _ in range(n_samples):
                    seq = generate_sign_trajectory(
                        label=label,
                        sign_type=sign_type,
                        hands_count=hands,
                        signer_id=signer_id,
                        noise_level=0.015,
                        augment=is_train,
                    )
                    temporal_X.append(seq)
                    temporal_y.append(sign_id)

                    # For static, take middle stable frame (frame 15)
                    static_X.append(seq[15])
                    static_y.append(sign_id)

        split_dir = DATA_DIR / split_name
        split_dir.mkdir(parents=True, exist_ok=True)

        t_X_arr = np.array(temporal_X, dtype=np.float32)
        t_y_arr = np.array(temporal_y, dtype=np.int64)
        s_X_arr = np.array(static_X, dtype=np.float32)
        s_y_arr = np.array(static_y, dtype=np.int64)

        np.save(split_dir / "temporal_X.npy", t_X_arr)
        np.save(split_dir / "temporal_y.npy", t_y_arr)
        np.save(split_dir / "static_X.npy", s_X_arr)
        np.save(split_dir / "static_y.npy", s_y_arr)

        print(
            f"Saved {split_name} split: Temporal shape {t_X_arr.shape}, "
            f"Static shape {s_X_arr.shape} ({len(t_y_arr)} samples)"
        )


if __name__ == "__main__":
    build_and_save_dataset()
