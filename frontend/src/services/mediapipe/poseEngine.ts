/**
 * Pose Engine for MediaPipe Pose (33 Landmarks).
 * Extracts torso orientation, shoulder-wrist spatial relationships, and head tilt.
 */

import { NormalizedLandmark } from './landmarkNormalizer';

export interface ProcessedPose {
  landmarks: NormalizedLandmark[];
  leftShoulder: NormalizedLandmark | null;
  rightShoulder: NormalizedLandmark | null;
  chestCenter: NormalizedLandmark | null;
  torsoAlignmentDeg: number;
  handsNearFace: boolean;
  handsNearChest: boolean;
}

export class PoseEngine {
  public processPose(rawLandmarks: NormalizedLandmark[]): ProcessedPose | null {
    if (!rawLandmarks || rawLandmarks.length < 33) return null;

    const leftShoulder = rawLandmarks[11];
    const rightShoulder = rawLandmarks[12];
    const leftWrist = rawLandmarks[15];
    const rightWrist = rawLandmarks[16];

    const chestCenter: NormalizedLandmark = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2,
    };

    // Torso rotation angle relative to camera
    const torsoAlignmentDeg = Math.round(
      Math.atan2(leftShoulder.z - rightShoulder.z, leftShoulder.x - rightShoulder.x) * (180 / Math.PI)
    );

    const handsNearFace =
      (leftWrist && leftWrist.y < leftShoulder.y) ||
      (rightWrist && rightWrist.y < rightShoulder.y);

    const handsNearChest =
      (leftWrist && Math.abs(leftWrist.y - chestCenter.y) < 0.2) ||
      (rightWrist && Math.abs(rightWrist.y - chestCenter.y) < 0.2);

    return {
      landmarks: rawLandmarks,
      leftShoulder,
      rightShoulder,
      chestCenter,
      torsoAlignmentDeg,
      handsNearFace,
      handsNearChest,
    };
  }
}

export const poseEngine = new PoseEngine();
