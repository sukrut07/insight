"""Holistic multimodal feature extraction for sign language recognition.

Extracts modality-specific features across hands, face, and pose with explicit
normalization, missing-modality masks, and non-manual grammatical marker detection.
"""
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from ml.feature_engineering import (
    FEATURE_SCHEMA,
    TOTAL_FEATURES,
    FEATURE_SCHEMA_VERSION,
    extract_features as extract_canonical_hand_features,
    validate_feature_vector,
)


class HolisticFeatureExtractor:
    """Extracts, normalizes, and fuses multi-modal landmarks for sign language processing.

    Linguistically, sign languages use:
    1. Hands (manual markers): handshape, orientation, location, movement.
    2. Face (non-manual markers): eyebrow position (questions/negation), mouth morphemes.
    3. Pose (upper body): torso shift, shoulder orientation, head tilt.
    """

    def __init__(self):
        self.hand_dim = TOTAL_FEATURES  # 148
        # Face cues: 8 eyebrow metrics, 4 eye openness metrics, 4 mouth geometry metrics, 3 head pose angles = 19
        self.face_dim = 19
        # Pose cues: 4 shoulder-elbow-wrist vectors (left & right 3D) + shoulder width + torso vertical = 14
        self.pose_dim = 14

    def extract_hand_features(
        self, detected_hands: List[Dict[str, Any]]
    ) -> Tuple[np.ndarray, Dict[str, bool], Dict[str, Any]]:
        """Extracts canonical 148-dimensional hand features with joint angles and presence mask."""
        features, schema_ver, validity_mask, meta = extract_canonical_hand_features(detected_hands)
        return features, validity_mask, meta

    def extract_face_features(
        self, face_landmarks: Optional[List[Dict[str, float]]]
    ) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """Extracts grammatical non-manual facial cues.

        MediaPipe Face Mesh (478 landmarks):
        - Left eyebrow: 70, 63, 105, 66, 107
        - Right eyebrow: 336, 296, 334, 293, 300
        - Nose bridge / tip: 1, 4, 168
        - Mouth outer lips: 61, 291, 0, 17
        - Chin: 152

        Returns:
            face_vector: (19,) float32 vector
            is_present: bool
            cues: Dict describing detected non-manual grammatical markers
        """
        if not face_landmarks or len(face_landmarks) < 468:
            return np.zeros((self.face_dim,), dtype=np.float32), False, {
                "eyebrows_raised": False,
                "eyebrows_furrowed": False,
                "mouth_open": False,
                "head_tilt": "neutral"
            }

        # Convert selected landmarks to numpy coordinates
        def get_pt(idx: int) -> np.ndarray:
            lm = face_landmarks[idx]
            return np.array([lm.get("x", 0.0), lm.get("y", 0.0), lm.get("z", 0.0)], dtype=np.float32)

        nose_tip = get_pt(1)
        nose_bridge = get_pt(168)
        chin = get_pt(152)

        face_height = np.linalg.norm(nose_bridge - chin)
        if face_height < 1e-4:
            face_height = 1.0

        # Eyebrow vertical distances relative to nose bridge
        left_brow_mid = get_pt(105)
        right_brow_mid = get_pt(334)
        left_brow_height = (nose_bridge[1] - left_brow_mid[1]) / face_height
        right_brow_height = (nose_bridge[1] - right_brow_mid[1]) / face_height

        # Brow furrowing (distance between inner eyebrows: left 107, right 336)
        brow_inner_dist = np.linalg.norm(get_pt(107) - get_pt(336)) / face_height

        # Mouth aperture (upper lip 0 to lower lip 17)
        mouth_top = get_pt(0)
        mouth_bottom = get_pt(17)
        mouth_left = get_pt(61)
        mouth_right = get_pt(291)

        mouth_height = np.linalg.norm(mouth_top - mouth_bottom) / face_height
        mouth_width = np.linalg.norm(mouth_left - mouth_right) / face_height

        # Head orientation approximation
        dx = chin[0] - nose_bridge[0]
        dy = chin[1] - nose_bridge[1]
        roll_angle = float(np.arctan2(dx, dy))

        face_vector = np.array([
            left_brow_height,
            right_brow_height,
            brow_inner_dist,
            mouth_height,
            mouth_width,
            roll_angle,
            left_brow_mid[0] - nose_tip[0],
            left_brow_mid[1] - nose_tip[1],
            right_brow_mid[0] - nose_tip[0],
            right_brow_mid[1] - nose_tip[1],
            mouth_top[0] - nose_tip[0],
            mouth_top[1] - nose_tip[1],
            mouth_bottom[0] - nose_tip[0],
            mouth_bottom[1] - nose_tip[1],
            chin[0] - nose_tip[0],
            chin[1] - nose_tip[1],
            nose_bridge[0] - nose_tip[0],
            nose_bridge[1] - nose_tip[1],
            face_height,
        ], dtype=np.float32)

        cues = {
            "eyebrows_raised": bool(left_brow_height > 0.32 or right_brow_height > 0.32),
            "eyebrows_furrowed": bool(brow_inner_dist < 0.18),
            "mouth_open": bool(mouth_height > 0.12),
            "head_tilt": "left" if roll_angle > 0.12 else ("right" if roll_angle < -0.12 else "neutral")
        }

        return face_vector, True, cues

    def extract_pose_features(
        self, pose_landmarks: Optional[List[Dict[str, float]]]
    ) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
        """Extracts upper-body spatial relationships.

        MediaPipe Pose:
        - Left shoulder: 11, Right shoulder: 12
        - Left elbow: 13, Right elbow: 14
        - Left wrist: 15, Right wrist: 16

        Returns:
            pose_vector: (14,) float32 vector
            is_present: bool
            cues: Dict describing body posture
        """
        if not pose_landmarks or len(pose_landmarks) < 17:
            return np.zeros((self.pose_dim,), dtype=np.float32), False, {"shoulders_level": True}

        def get_pt(idx: int) -> np.ndarray:
            lm = pose_landmarks[idx]
            return np.array([lm.get("x", 0.0), lm.get("y", 0.0), lm.get("z", 0.0)], dtype=np.float32)

        left_shoulder = get_pt(11)
        right_shoulder = get_pt(12)
        left_elbow = get_pt(13)
        right_elbow = get_pt(14)
        left_wrist = get_pt(15)
        right_wrist = get_pt(16)

        # Scale by shoulder distance
        shoulder_dist = np.linalg.norm(left_shoulder - right_shoulder)
        if shoulder_dist < 1e-4:
            shoulder_dist = 1.0

        mid_shoulder = (left_shoulder + right_shoulder) * 0.5

        # Normalized vectors from mid-shoulder
        v_l_shoulder = (left_shoulder - mid_shoulder) / shoulder_dist
        v_r_shoulder = (right_shoulder - mid_shoulder) / shoulder_dist
        v_l_elbow = (left_elbow - mid_shoulder) / shoulder_dist
        v_r_elbow = (right_elbow - mid_shoulder) / shoulder_dist
        v_l_wrist = (left_wrist - mid_shoulder) / shoulder_dist
        v_r_wrist = (right_wrist - mid_shoulder) / shoulder_dist

        # Shoulder tilt
        shoulder_slope = (left_shoulder[1] - right_shoulder[1]) / shoulder_dist

        pose_vector = np.array([
            v_l_shoulder[0], v_l_shoulder[1],
            v_r_shoulder[0], v_r_shoulder[1],
            v_l_elbow[0], v_l_elbow[1],
            v_r_elbow[0], v_r_elbow[1],
            v_l_wrist[0], v_l_wrist[1],
            v_r_wrist[0], v_r_wrist[1],
            shoulder_dist,
            shoulder_slope,
        ], dtype=np.float32)

        cues = {
            "shoulders_level": bool(abs(shoulder_slope) < 0.10),
            "hands_elevated": bool(left_wrist[1] < left_shoulder[1] or right_wrist[1] < right_shoulder[1])
        }

        return pose_vector, True, cues

    def fuse_features(
        self,
        detected_hands: List[Dict[str, Any]],
        pose_landmarks: Optional[List[Dict[str, float]]] = None,
        face_landmarks: Optional[List[Dict[str, float]]] = None,
    ) -> Dict[str, Any]:
        """Fuses hand, face, and pose modalities with missing-data masks.

        Ensures full backward compatibility by keeping canonical_hand_features
        as a strict 148-dim array for existing trained models.
        """
        hand_feat, hand_valid, hand_meta = self.extract_hand_features(detected_hands)
        face_feat, face_present, face_cues = self.extract_face_features(face_landmarks)
        pose_feat, pose_present, pose_cues = self.extract_pose_features(pose_landmarks)

        modality_mask = {
            "hands": bool(hand_valid.get("is_complete", False)),
            "face": bool(face_present),
            "pose": bool(pose_present),
        }

        non_manual_markers: List[str] = []
        if face_cues.get("eyebrows_raised"):
            non_manual_markers.append("eyebrows_raised_question")
        if face_cues.get("eyebrows_furrowed"):
            non_manual_markers.append("eyebrows_furrowed_wh_question")
        if face_cues.get("mouth_open"):
            non_manual_markers.append("mouthing_open")
        if face_cues.get("head_tilt") != "neutral":
            non_manual_markers.append(f"head_tilt_{face_cues['head_tilt']}")
        if pose_cues.get("hands_elevated"):
            non_manual_markers.append("pose_hands_elevated")

        return {
            "canonical_hand_features": hand_feat,
            "face_features": face_feat,
            "pose_features": pose_feat,
            "modality_mask": modality_mask,
            "hand_metadata": hand_meta,
            "non_manual_markers": non_manual_markers,
            "has_holistic_context": face_present or pose_present,
            "schema_version": FEATURE_SCHEMA_VERSION,
        }


holistic_extractor = HolisticFeatureExtractor()
