/**
 * Face Engine for MediaPipe Face Mesh (Non-Manual Signing Cues).
 *
 * Extracts head orientation, question-furrow, and mouth shapes
 * strictly for sign-language grammatical disambiguation.
 * Does not infer emotions or personal characteristics.
 */

import { NormalizedLandmark } from './landmarkNormalizer';

export interface NonManualSigningCues {
  headTiltDeg: number;
  headTurnDeg: number;
  eyebrowsRaised: boolean;
  eyebrowsFurrowed: boolean;
  mouthOpen: boolean;
  isQuestionCueActive: boolean;
}

export class FaceEngine {
  public processFace(rawLandmarks: NormalizedLandmark[]): NonManualSigningCues | null {
    if (!rawLandmarks || rawLandmarks.length < 468) return null;

    // Nose tip (1), Chin (152), Left Cheek (234), Right Cheek (454)
    const nose = rawLandmarks[1];
    const chin = rawLandmarks[152];
    const leftCheek = rawLandmarks[234];
    const rightCheek = rawLandmarks[454];

    // Eyebrows (left: 70, right: 300) and eyes (left: 159, right: 386)
    const leftEyebrow = rawLandmarks[70];
    const rightEyebrow = rawLandmarks[300];
    const leftEye = rawLandmarks[159];
    const rightEye = rawLandmarks[386];

    // Lips: upper (13), lower (14)
    const upperLip = rawLandmarks[13];
    const lowerLip = rawLandmarks[14];

    // Head tilt (roll in frontal plane)
    const headTiltDeg = Math.round(
      Math.atan2(chin.x - nose.x, chin.y - nose.y) * (180 / Math.PI)
    );

    // Head turn (yaw)
    const dLeft = Math.hypot(nose.x - leftCheek.x, nose.y - leftCheek.y);
    const dRight = Math.hypot(nose.x - rightCheek.x, nose.y - rightCheek.y);
    const headTurnDeg = Math.round(((dLeft - dRight) / (dLeft + dRight || 1)) * 45);

    // Eyebrow raise/furrow relative to eyes
    const browEyeDist =
      (Math.abs(leftEyebrow.y - leftEye.y) + Math.abs(rightEyebrow.y - rightEye.y)) / 2;
    const eyebrowsRaised = browEyeDist > 0.055;
    const eyebrowsFurrowed = browEyeDist < 0.038;

    // Mouth openness
    const mouthDist = Math.abs(lowerLip.y - upperLip.y);
    const mouthOpen = mouthDist > 0.04;

    // Non-manual marker for WH-questions vs Polar Yes/No questions
    const isQuestionCueActive = eyebrowsFurrowed || eyebrowsRaised;

    return {
      headTiltDeg,
      headTurnDeg,
      eyebrowsRaised,
      eyebrowsFurrowed,
      mouthOpen,
      isQuestionCueActive,
    };
  }
}

export const faceEngine = new FaceEngine();
