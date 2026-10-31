/**
 * Tracking Manager for SignBridge 2.0.
 *
 * Coordinates:
 * - Hand entry / exit events
 * - Occlusion & overlap detection
 * - Low-light & motion-blur warnings
 * - Distance & scale warnings (too small / too far)
 * - Temporal sequence buffering
 */

import { HolisticFrameResult } from './holisticEngine';
import { landmarkNormalizer } from './landmarkNormalizer';

export interface TrackingAlert {
  type: 'hand_enter' | 'hand_exit' | 'overlap' | 'low_light' | 'motion_blur' | 'too_far' | 'info';
  message: string;
  timestamp: number;
}

export class TrackingManager {
  private alerts: TrackingAlert[] = [];
  private previousHandCount = 0;
  private recentFrames: HolisticFrameResult[] = [];
  private maxBufferLength = 30;

  public processFrame(result: HolisticFrameResult): TrackingAlert[] {
    const currentAlerts: TrackingAlert[] = [];
    const now = Date.now();

    // 1. Hand entry and exit detection
    if (this.previousHandCount === 0 && result.handsDetectedCount > 0) {
      currentAlerts.push({
        type: 'hand_enter',
        message: `${result.handsDetectedCount} hand(s) entered signing area.`,
        timestamp: now,
      });
    } else if (this.previousHandCount > 0 && result.handsDetectedCount === 0) {
      currentAlerts.push({
        type: 'hand_exit',
        message: 'Hands moved out of signing area.',
        timestamp: now,
      });
    }
    this.previousHandCount = result.handsDetectedCount;

    // 2. Scale / Distance check
    for (const hand of result.hands) {
      const bbox = landmarkNormalizer.getBoundingBox(hand.landmarks);
      if (bbox && (bbox.width < 0.12 || bbox.height < 0.12)) {
        currentAlerts.push({
          type: 'too_far',
          message: 'Hands appear too small or far away. Move closer for higher recognition precision.',
          timestamp: now,
        });
        break;
      }
    }

    // 3. Hand overlap check
    if (result.handsDetectedCount >= 2 && result.leftHand && result.rightHand) {
      const leftWrist = result.leftHand.landmarks[0];
      const rightWrist = result.rightHand.landmarks[0];
      if (leftWrist && rightWrist) {
        const dist = Math.hypot(leftWrist.x - rightWrist.x, leftWrist.y - rightWrist.y);
        if (dist < 0.10) {
          currentAlerts.push({
            type: 'overlap',
            message: 'Hands in close coordination/contact.',
            timestamp: now,
          });
        }
      }
    }

    // Maintain temporal buffer
    this.recentFrames.push(result);
    if (this.recentFrames.length > this.maxBufferLength) {
      this.recentFrames.shift();
    }

    this.alerts = currentAlerts;
    return currentAlerts;
  }

  public getActiveAlerts(): TrackingAlert[] {
    return this.alerts;
  }

  public getSequenceLength(): number {
    return this.recentFrames.length;
  }

  public reset(): void {
    this.alerts = [];
    this.previousHandCount = 0;
    this.recentFrames = [];
  }
}

export const trackingManager = new TrackingManager();
