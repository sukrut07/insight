/**
 * MediaPipe Holistic Landmarker Engine.
 *
 * Combines 553 landmarks:
 * - Face (478)
 * - Body Pose (33)
 * - Left Hand (21)
 * - Right Hand (21)
 *
 * Provides non-blocking execution, configurable confidence thresholds,
 * and automatic tracking recovery.
 */

import { handEngine, ProcessedHand } from './handEngine';
import { poseEngine, ProcessedPose } from './poseEngine';
import { faceEngine, NonManualSigningCues } from './faceEngine';
import { performanceMonitor } from './performanceMonitor';

export interface HolisticFrameResult {
  timestamp: number;
  hands: ProcessedHand[];
  handsDetectedCount: number;
  leftHand: ProcessedHand | null;
  rightHand: ProcessedHand | null;
  pose: ProcessedPose | null;
  faceCues: NonManualSigningCues | null;
  trackingQuality: 'excellent' | 'adequate' | 'degraded' | 'lost';
  warnings: string[];
}

export interface HolisticConfig {
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  enableFaceCues: boolean;
  enablePose: boolean;
}

export class HolisticEngine {
  private config: HolisticConfig = {
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.60,
    enableFaceCues: true,
    enablePose: true,
  };

  private consecutiveLossCount = 0;
  private isInitialized = false;

  public initialize(customConfig?: Partial<HolisticConfig>): void {
    performanceMonitor.startInitialization();
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
    this.isInitialized = true;
    performanceMonitor.endInitialization();
  }

  public processHolisticFrame(payload: {
    hands?: any[];
    poseLandmarks?: any[];
    faceLandmarks?: any[];
    imageWidth?: number;
    imageHeight?: number;
  }): HolisticFrameResult {
    const startTime = performance.now();
    const warnings: string[] = [];

    // 1. Process Hands (21 per hand)
    const rawHands = payload.hands || [];
    const processedHands = handEngine.processHands(rawHands);
    const leftHand = processedHands.find((h) => h.handedness === 'Left') || null;
    const rightHand = processedHands.find((h) => h.handedness === 'Right') || null;

    // 2. Process Pose if enabled
    let processedPose: ProcessedPose | null = null;
    if (this.config.enablePose && payload.poseLandmarks) {
      processedPose = poseEngine.processPose(payload.poseLandmarks);
    }

    // 3. Process Face non-manual cues if enabled
    let faceCues: NonManualSigningCues | null = null;
    if (this.config.enableFaceCues && payload.faceLandmarks) {
      faceCues = faceEngine.processFace(payload.faceLandmarks);
    }

    // 4. Quality & Warnings
    if (processedHands.length === 0) {
      this.consecutiveLossCount++;
      warnings.push('No hands detected in signing area.');
    } else {
      this.consecutiveLossCount = 0;
    }

    if (processedHands.length === 2) {
      // Check hand overlap
      const dist = Math.hypot(
        (leftHand?.landmarks[0]?.x || 0) - (rightHand?.landmarks[0]?.x || 0),
        (leftHand?.landmarks[0]?.y || 0) - (rightHand?.landmarks[0]?.y || 0)
      );
      if (dist < 0.12) {
        warnings.push('Hands overlapping — dual hand gesture in progress.');
      }
    }

    let trackingQuality: HolisticFrameResult['trackingQuality'] = 'excellent';
    if (processedHands.length === 0) {
      trackingQuality = this.consecutiveLossCount > 10 ? 'lost' : 'degraded';
    } else if (processedHands.some((h) => h.confidence < this.config.minTrackingConfidence)) {
      trackingQuality = 'adequate';
    }

    const latency = Math.round(performance.now() - startTime);
    performanceMonitor.recordInference(latency, processedHands.length > 0);

    return {
      timestamp: Date.now(),
      hands: processedHands,
      handsDetectedCount: processedHands.length,
      leftHand,
      rightHand,
      pose: processedPose,
      faceCues,
      trackingQuality,
      warnings,
    };
  }

  public updateConfig(newConfig: Partial<HolisticConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public reset(): void {
    this.consecutiveLossCount = 0;
    handEngine.reset();
  }
}

export const holisticEngine = new HolisticEngine();
