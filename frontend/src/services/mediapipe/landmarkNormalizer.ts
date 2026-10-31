/**
 * Landmark Normalization and Feature Extraction.
 *
 * Normalizes 21-point hand landmarks, computes palm orientation,
 * finger extension states, and relative distances for sign classification.
 */

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandOrientationInfo {
  palmFacing: 'forward' | 'inward' | 'upward' | 'downward' | 'sideways';
  pitchDeg: number;
  rollDeg: number;
  fingerStates: {
    thumb: 'extended' | 'curled';
    index: 'extended' | 'curled';
    middle: 'extended' | 'curled';
    ring: 'extended' | 'curled';
    pinky: 'extended' | 'curled';
  };
}

export class LandmarkNormalizer {
  /**
   * Translates wrist (point 0) to origin and scales landmarks by hand span.
   */
  public normalizeHandLandmarks(landmarks: NormalizedLandmark[]): NormalizedLandmark[] {
    if (!landmarks || landmarks.length !== 21) return [];

    const wrist = landmarks[0];
    const middleMcp = landmarks[9];

    // Compute characteristic scale distance (wrist to middle MCP)
    const scale = Math.sqrt(
      Math.pow(middleMcp.x - wrist.x, 2) +
      Math.pow(middleMcp.y - wrist.y, 2) +
      Math.pow(middleMcp.z - wrist.z, 2)
    ) || 1.0;

    return landmarks.map((lm) => ({
      x: Number(((lm.x - wrist.x) / scale).toFixed(4)),
      y: Number(((lm.y - wrist.y) / scale).toFixed(4)),
      z: Number(((lm.z - wrist.z) / scale).toFixed(4)),
    }));
  }

  /**
   * Computes finger extension states and palm orientation.
   */
  public computeOrientation(landmarks: NormalizedLandmark[]): HandOrientationInfo {
    if (!landmarks || landmarks.length < 21) {
      return {
        palmFacing: 'forward',
        pitchDeg: 0,
        rollDeg: 0,
        fingerStates: {
          thumb: 'curled',
          index: 'curled',
          middle: 'curled',
          ring: 'curled',
          pinky: 'curled',
        },
      };
    }

    const wrist = landmarks[0];

    // Check finger curl: tip distance to wrist vs PIP distance to wrist
    const isExtended = (tipIdx: number, pipIdx: number) => {
      const tipDist = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
      const pipDist = Math.hypot(landmarks[pipIdx].x - wrist.x, landmarks[pipIdx].y - wrist.y);
      return tipDist > pipDist * 1.15;
    };

    const fingerStates = {
      thumb: isExtended(4, 2) ? ('extended' as const) : ('curled' as const),
      index: isExtended(8, 6) ? ('extended' as const) : ('curled' as const),
      middle: isExtended(12, 10) ? ('extended' as const) : ('curled' as const),
      ring: isExtended(16, 14) ? ('extended' as const) : ('curled' as const),
      pinky: isExtended(20, 18) ? ('extended' as const) : ('curled' as const),
    };

    // Vector v1: wrist to middle MCP (point 9)
    const v1 = {
      x: landmarks[9].x - landmarks[0].x,
      y: landmarks[9].y - landmarks[0].y,
      z: landmarks[9].z - landmarks[0].z,
    };

    // Vector v2: wrist to index MCP (point 5)
    const v2 = {
      x: landmarks[5].x - landmarks[0].x,
      y: landmarks[5].y - landmarks[0].y,
      z: landmarks[5].z - landmarks[0].z,
    };

    // Normal vector via cross product (palm normal)
    const normalZ = v1.x * v2.y - v1.y * v2.x;
    let palmFacing: HandOrientationInfo['palmFacing'] = 'forward';

    if (normalZ > 0.02) {
      palmFacing = 'forward';
    } else if (normalZ < -0.02) {
      palmFacing = 'inward';
    } else if (Math.abs(v1.x) > Math.abs(v1.y)) {
      palmFacing = 'sideways';
    } else if (v1.y > 0) {
      palmFacing = 'downward';
    } else {
      palmFacing = 'upward';
    }

    const pitchDeg = Math.round(Math.atan2(v1.y, Math.sqrt(v1.x * v1.x + v1.z * v1.z)) * (180 / Math.PI));
    const rollDeg = Math.round(Math.atan2(v1.x, v1.y) * (180 / Math.PI));

    return {
      palmFacing,
      pitchDeg,
      rollDeg,
      fingerStates,
    };
  }

  /**
   * Computes 2D bounding box for hand.
   */
  public getBoundingBox(landmarks: NormalizedLandmark[]) {
    if (!landmarks.length) return null;
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const lm of landmarks) {
      if (lm.x < minX) minX = lm.x;
      if (lm.x > maxX) maxX = lm.x;
      if (lm.y < minY) minY = lm.y;
      if (lm.y > maxY) maxY = lm.y;
    }
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }
}

export const landmarkNormalizer = new LandmarkNormalizer();
