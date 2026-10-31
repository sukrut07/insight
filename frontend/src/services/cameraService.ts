/**
 * Camera Service for SignBridge 2.0.
 *
 * Handles camera permission requests, device enumeration, 1280x720 resolution negotiation
 * with fallback, track disposal, and device change listeners.
 */

export interface CameraDevice {
  deviceId: string;
  label: string;
  isFrontFacing: boolean;
}

export type CameraErrorType =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_DISMISSED'
  | 'DEVICE_NOT_FOUND'
  | 'CAMERA_BUSY'
  | 'INSECURE_CONTEXT'
  | 'STREAM_TIMEOUT'
  | 'UNKNOWN';

export interface CameraErrorResult {
  type: CameraErrorType;
  message: string;
  actionableHint: string;
}

export class CameraService {
  /**
   * Validates whether browser environment supports camera access.
   */
  public checkSupport(): { supported: boolean; reason?: CameraErrorResult } {
    if (typeof window === 'undefined') {
      return {
        supported: false,
        reason: {
          type: 'NOT_SUPPORTED',
          message: 'Window object unavailable.',
          actionableHint: 'Run in a modern web browser.',
        },
      };
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return {
        supported: false,
        reason: {
          type: 'INSECURE_CONTEXT',
          message: 'Camera access requires a secure HTTPS context or localhost.',
          actionableHint: 'Access via https:// or use localhost for development.',
        },
      };
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        reason: {
          type: 'NOT_SUPPORTED',
          message: 'Browser does not support navigator.mediaDevices.getUserMedia.',
          actionableHint: 'Upgrade to a modern version of Chrome, Firefox, Safari, or Edge.',
        },
      };
    }

    return { supported: true };
  }

  /**
   * Requests media stream with 1280x720 ideal resolution and fallback to standard resolution.
   */
  public async requestStream(
    deviceId?: string,
    idealWidth = 1280,
    idealHeight = 720
  ): Promise<{ stream: MediaStream | null; error: CameraErrorResult | null }> {
    const support = this.checkSupport();
    if (!support.supported && support.reason) {
      return { stream: null, error: support.reason };
    }

    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: idealWidth, min: 640 },
            height: { ideal: idealHeight, min: 480 },
            frameRate: { ideal: 30, max: 30 },
          }
        : {
            facingMode: 'user',
            width: { ideal: idealWidth, min: 640 },
            height: { ideal: idealHeight, min: 480 },
            frameRate: { ideal: 30, max: 30 },
          },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return { stream, error: null };
    } catch (err: any) {
      // If 1280x720 fails, attempt lower resolution fallback
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
          audio: false,
        });
        return { stream: fallbackStream, error: null };
      } catch (fallbackErr: any) {
        return { stream: null, error: this._parseCameraError(fallbackErr) };
      }
    }
  }

  /**
   * Enumerates available video input devices after permission is granted.
   */
  public async getAvailableCameras(): Promise<CameraDevice[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
          isFrontFacing: d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('user') || d.label.toLowerCase().includes('facetime'),
        }));
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
      return [];
    }
  }

  /**
   * Cleanly disposes of all media stream tracks.
   */
  public stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
    } catch (err) {
      console.warn('Error stopping media tracks:', err);
    }
  }

  private _parseCameraError(err: any): CameraErrorResult {
    const name = err?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return {
        type: 'PERMISSION_DENIED',
        message: 'Camera permission was denied in your browser.',
        actionableHint: 'Click the camera/lock icon in your browser address bar and choose "Allow".',
      };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        type: 'DEVICE_NOT_FOUND',
        message: 'No video capture device detected.',
        actionableHint: 'Ensure your webcam is plugged in or built-in camera is enabled.',
      };
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return {
        type: 'CAMERA_BUSY',
        message: 'Camera is currently in use by another application or tab.',
        actionableHint: 'Close other tabs, Zoom, FaceTime, or video apps using the camera.',
      };
    }
    if (name === 'AbortError') {
      return {
        type: 'PERMISSION_DISMISSED',
        message: 'Camera prompt was dismissed before permission was granted.',
        actionableHint: 'Click "Enable Camera" again and select "Allow".',
      };
    }

    return {
      type: 'UNKNOWN',
      message: err?.message || 'An unexpected error occurred accessing your camera.',
      actionableHint: 'Reload the page or verify browser permissions.',
    };
  }
}

export const cameraService = new CameraService();
