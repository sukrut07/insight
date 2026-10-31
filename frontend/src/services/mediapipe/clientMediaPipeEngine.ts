/**
 * Client-Side MediaPipe Hand Landmarker Engine.
 *
 * Runs locally in the browser via WebAssembly/WebGPU (@mediapipe/tasks-vision).
 * Provides seamless 30+ FPS landmark tracking, skeleton rendering, and real-time
 * gesture recognition when deployed to static or serverless environments (e.g. Vercel)
 * where persistent Python WebSockets are not available.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { landmarkNormalizer, NormalizedLandmark } from './landmarkNormalizer';

export interface ClientRecognitionResult {
  type: 'recognition_result';
  status: string;
  label: string;
  raw_label: string;
  confidence: number;
  confidence_tier: 'high' | 'medium' | 'low';
  is_stable: boolean;
  hands_detected: number;
  left_hand: boolean;
  right_hand: boolean;
  fps: number;
  latency_ms: number;
  annotated_frame: string | null;
  new_word_emitted: string | null;
}

class ClientMediaPipeEngine {
  private landmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private initPromise: Promise<HandLandmarker | null> | null = null;

  // Offscreen canvas for drawing skeleton overlays
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // Performance & FPS tracking
  private lastFrameTime = performance.now();
  private fpsEstimate = 30;

  // Hysteresis & Stability State Machine
  private consecutiveLabel = 'NONE';
  private consecutiveCount = 0;
  private lastEmittedWord: string | null = null;
  private readonly STABILITY_THRESHOLD = 4; // 4 consecutive frames

  public async initialize(): Promise<HandLandmarker | null> {
    if (this.landmarker) return this.landmarker;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        console.log('[MediaPipe Client] Loading vision WASM assets from CDN...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        console.log('[MediaPipe Client] Initializing HandLandmarker task model...');
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        console.log('[MediaPipe Client] HandLandmarker ready.');
        return this.landmarker;
      } catch (err) {
        console.warn('[MediaPipe Client] Initialization failed, falling back to CPU delegate:', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          );
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.45,
            minHandPresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
          });
          return this.landmarker;
        } catch (cpuErr) {
          console.error('[MediaPipe Client] Fatal initialization error:', cpuErr);
          return null;
        }
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  public isReady(): boolean {
    return this.landmarker !== null;
  }

  public processVideoFrame(
    video: HTMLVideoElement,
    activeLanguage: string = 'ISL'
  ): ClientRecognitionResult | null {
    if (!this.landmarker || video.readyState < 2) {
      if (!this.landmarker && !this.isInitializing) {
        this.initialize().catch(() => {});
      }
      return null;
    }

    const tStart = performance.now();
    let results;
    try {
      results = this.landmarker.detectForVideo(video, tStart);
    } catch (detectErr) {
      console.warn('[MediaPipe Client] detectForVideo skipped frame:', detectErr);
      return null;
    }

    // FPS estimation
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    if (dt > 0) {
      this.fpsEstimate = Math.round(0.9 * this.fpsEstimate + 0.1 * (1.0 / dt));
    }

    const handsDetected = results.landmarks ? results.landmarks.length : 0;
    let hasLeft = false;
    let hasRight = false;

    if (results.handedness && results.handedness.length > 0) {
      for (const h of results.handedness) {
        const cat = h[0]?.categoryName?.toLowerCase();
        if (cat === 'left') hasLeft = true;
        if (cat === 'right') hasRight = true;
      }
    }

    // Prepare offscreen canvas for skeleton drawing
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    if (this.canvas.width !== vw || this.canvas.height !== vh) {
      this.canvas.width = vw;
      this.canvas.height = vh;
    }

    let annotatedFrameUrl: string | null = null;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, vw, vh);
      // Draw background camera frame
      this.ctx.drawImage(video, 0, 0, vw, vh);

      if (handsDetected > 0) {
        // Draw MediaPipe hand connections and landmarks
        for (const landmarks of results.landmarks) {
          this.drawHandSkeleton(this.ctx, landmarks, vw, vh);
        }
        annotatedFrameUrl = this.canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    // Classify gesture from landmarks
    let rawLabel = 'NONE';
    let confidence = 0.0;

    if (handsDetected > 0 && results.landmarks[0]) {
      const classification = this.classifyHandLandmarks(
        results.landmarks,
        activeLanguage
      );
      rawLabel = classification.label;
      confidence = classification.confidence;
    }

    // Hysteresis State Machine
    let isStable = false;
    let newWordEmitted: string | null = null;

    if (rawLabel !== 'NONE' && confidence >= 0.60) {
      if (rawLabel === this.consecutiveLabel) {
        this.consecutiveCount += 1;
      } else {
        this.consecutiveLabel = rawLabel;
        this.consecutiveCount = 1;
      }

      if (this.consecutiveCount >= this.STABILITY_THRESHOLD) {
        isStable = true;
        if (this.lastEmittedWord !== rawLabel) {
          newWordEmitted = rawLabel;
          this.lastEmittedWord = rawLabel;
        }
      }
    } else {
      this.consecutiveCount = Math.max(0, this.consecutiveCount - 1);
      if (this.consecutiveCount === 0) {
        this.consecutiveLabel = 'NONE';
      }
    }

    const latency = Math.round(performance.now() - tStart);
    const confTier = confidence >= 0.75 ? 'high' : confidence >= 0.45 ? 'medium' : 'low';

    return {
      type: 'recognition_result',
      status: rawLabel !== 'NONE' ? 'recognized' : 'idle',
      label: rawLabel,
      raw_label: rawLabel,
      confidence,
      confidence_tier: confTier,
      is_stable: isStable,
      hands_detected: handsDetected,
      left_hand: hasLeft,
      right_hand: hasRight,
      fps: this.fpsEstimate,
      latency_ms: latency,
      annotated_frame: annotatedFrameUrl,
      new_word_emitted: newWordEmitted,
    };
  }

  private drawHandSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
  ) {
    if (!HandLandmarker.HAND_CONNECTIONS) return;

    // Draw connecting lines with vibrant mint / emerald
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const conn of HandLandmarker.HAND_CONNECTIONS) {
      const p1 = landmarks[conn.start];
      const p2 = landmarks[conn.end];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    // Draw landmark points
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const x = pt.x * width;
      const y = pt.y * height;

      ctx.beginPath();
      ctx.arc(x, y, i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20 ? 5 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = i === 4 || i === 8 ? '#F59E0B' : '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#242424';
      ctx.stroke();
    }
  }

  private classifyHandLandmarks(
    handsLandmarks: NormalizedLandmark[][],
    language: string
  ): { label: string; confidence: number } {
    const primaryHand = handsLandmarks[0];
    if (!primaryHand || primaryHand.length !== 21) {
      return { label: 'NONE', confidence: 0.0 };
    }

    const orientation = landmarkNormalizer.computeOrientation(primaryHand);
    const { fingerStates, palmFacing } = orientation;
    const { thumb, index, middle, ring, pinky } = fingerStates;

    const wrist = primaryHand[0];
    const indexTip = primaryHand[8];
    const thumbTip = primaryHand[4];
    const isDualHand = handsLandmarks.length >= 2;

    const extendedCount = [thumb, index, middle, ring, pinky].filter((s) => s === 'extended').length;

    // 1. HELP (Dual hand support or thumbs up)
    if (isDualHand) {
      const secondHand = handsLandmarks[1];
      const dist = Math.hypot(wrist.x - secondHand[0].x, wrist.y - secondHand[0].y);
      if (dist < 0.25) {
        return { label: 'HELP', confidence: 0.92 };
      }
    }

    // 2. HELLO (Open hand near head / forehead level: y < 0.40)
    if (extendedCount >= 4 && wrist.y < 0.42) {
      return { label: 'HELLO', confidence: 0.94 };
    }

    // 3. GOODBYE (All 5 extended, palm facing forward, chest level)
    if (extendedCount === 5 && wrist.y >= 0.42 && wrist.y < 0.75 && (palmFacing === 'forward' || palmFacing === 'sideways')) {
      return { label: 'GOODBYE', confidence: 0.90 };
    }

    // 4. THANK_YOU (Flat hand touching/near chin/mouth: y between 0.38 and 0.52)
    if (extendedCount >= 4 && indexTip.y > 0.35 && indexTip.y < 0.52) {
      return { label: 'THANK_YOU', confidence: 0.88 };
    }

    // 5. PLEASE (Flat hand on chest: y >= 0.52)
    if (extendedCount >= 4 && wrist.y >= 0.52) {
      return { label: 'PLEASE', confidence: 0.87 };
    }

    // 6. SORRY (Fist / curled hand on chest)
    if (extendedCount <= 1 && wrist.y > 0.45 && wrist.y < 0.75) {
      return { label: 'SORRY', confidence: 0.89 };
    }

    // 7. WATER (W shape: index, middle, ring extended; pinky & thumb curled)
    if (index === 'extended' && middle === 'extended' && ring === 'extended' && pinky === 'curled') {
      return { label: 'WATER', confidence: 0.91 };
    }

    // 8. FOOD (Fingertips clustered near mouth: y < 0.45)
    const tipSpread = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    if (tipSpread < 0.08 && indexTip.y < 0.48) {
      return { label: 'FOOD', confidence: 0.93 };
    }

    // 9. WHAT (Open hand, palm facing upward)
    if (extendedCount >= 3 && palmFacing === 'upward') {
      return { label: 'WHAT', confidence: 0.86 };
    }

    // 10. WHERE / POINTING (Index finger extended alone, pointing up)
    if (index === 'extended' && middle === 'curled' && ring === 'curled' && pinky === 'curled' && thumb === 'curled') {
      return { label: 'WHERE', confidence: 0.92 };
    }

    // 11. YES (Fist, closed hand)
    if (extendedCount === 0) {
      return { label: 'YES', confidence: 0.85 };
    }

    // 12. Alphabet detection:
    // 'V' sign (index + middle extended)
    if (index === 'extended' && middle === 'extended' && ring === 'curled' && pinky === 'curled') {
      return { label: 'V', confidence: 0.90 };
    }

    // 'L' sign (thumb + index extended at right angle)
    if (thumb === 'extended' && index === 'extended' && middle === 'curled' && ring === 'curled' && pinky === 'curled') {
      return { label: 'L', confidence: 0.92 };
    }

    // 'Y' / Shaka sign (thumb + pinky extended)
    if (thumb === 'extended' && pinky === 'extended' && index === 'curled' && middle === 'curled' && ring === 'curled') {
      return { label: 'Y', confidence: 0.91 };
    }

    // 'I' sign (pinky extended alone)
    if (pinky === 'extended' && index === 'curled' && middle === 'curled' && ring === 'curled') {
      return { label: 'I', confidence: 0.89 };
    }

    return { label: 'NONE', confidence: 0.0 };
  }

  public reset(): void {
    this.consecutiveLabel = 'NONE';
    this.consecutiveCount = 0;
    this.lastEmittedWord = null;
  }
}

export const clientMediaPipeEngine = new ClientMediaPipeEngine();
