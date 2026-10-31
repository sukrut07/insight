/**
 * Hand Engine for MediaPipe Hand Tracking (21 landmarks per hand).
 * Supports dual hands, handedness consistency, and orientation extraction.
 */

import { landmarkNormalizer, NormalizedLandmark, HandOrientationInfo } from './landmarkNormalizer';

export interface ProcessedHand {
  handedness: 'Left' | 'Right';
  landmarks: NormalizedLandmark[];
  normalizedLandmarks: NormalizedLandmark[];
  orientation: HandOrientationInfo;
  confidence: number;
}

export class HandEngine {
  private lastLeftHand: ProcessedHand | null = null;
  private lastRightHand: ProcessedHand | null = null;

  public processHands(rawHandsData: any[]): ProcessedHand[] {
    const results: ProcessedHand[] = [];

    for (const hand of rawHandsData) {
      const rawLms: NormalizedLandmark[] = hand.landmarks || [];
      if (rawLms.length !== 21) continue;

      const handedness: 'Left' | 'Right' = hand.handedness === 'Left' ? 'Left' : 'Right';
      const normalizedLandmarks = landmarkNormalizer.normalizeHandLandmarks(rawLms);
      const orientation = landmarkNormalizer.computeOrientation(rawLms);

      const processed: ProcessedHand = {
        handedness,
        landmarks: rawLms,
        normalizedLandmarks,
        orientation,
        confidence: hand.score || 0.95,
      };

      if (handedness === 'Left') {
        this.lastLeftHand = processed;
      } else {
        this.lastRightHand = processed;
      }

      results.push(processed);
    }

    return results;
  }

  public getBothHands(): { left: ProcessedHand | null; right: ProcessedHand | null } {
    return { left: this.lastLeftHand, right: this.lastRightHand };
  }

  public reset(): void {
    this.lastLeftHand = null;
    this.lastRightHand = null;
  }
}

export const handEngine = new HandEngine();
