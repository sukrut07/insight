/**
 * useCamera Hook for SignBridge 2.0.
 *
 * Provides a secure, user-initiated camera workflow:
 * - Does not auto-start on load
 * - Manages device selection and resolution negotiation
 * - Listens for disconnects and visibility changes
 * - Handles frame capture and disposal
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  cameraService,
  CameraDevice,
  CameraErrorResult,
} from '../services/cameraService';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'paused'
  | 'error'
  | 'denied';

interface UseCameraOptions {
  onFrame?: (base64Frame: string, videoElement?: HTMLVideoElement | null) => void;
  targetFps?: number;
  autoStart?: boolean; // Default false as per requirements
}

export function useCamera({
  onFrame,
  targetFps = 25,
  autoStart = false,
}: UseCameraOptions = {}) {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<CameraErrorResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameTimerRef = useRef<number | null>(null);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (streamRef.current) {
      cameraService.stopStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  // Start camera stream on explicit user action
  const startCamera = useCallback(
    async (deviceId?: string) => {
      setStatus('requesting');
      setError(null);

      const targetId = deviceId || selectedDeviceId || undefined;
      const { stream, error: reqError } = await cameraService.requestStream(targetId);

      if (reqError || !stream) {
        setError(reqError);
        setStatus(reqError?.type === 'PERMISSION_DENIED' ? 'denied' : 'error');
        return false;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play interrupted:', playErr);
        }
      }

      // Enumerate available devices
      const available = await cameraService.getAvailableCameras();
      setDevices(available);
      if (!selectedDeviceId && available.length > 0) {
        const activeTrack = stream.getVideoTracks()[0];
        const currentSetting = activeTrack?.getSettings();
        if (currentSetting?.deviceId) {
          setSelectedDeviceId(currentSetting.deviceId);
        } else {
          setSelectedDeviceId(available[0].deviceId);
        }
      }

      setStatus('active');
      return true;
    },
    [selectedDeviceId]
  );

  // Switch camera device
  const switchCamera = useCallback(
    async (newDeviceId: string) => {
      if (newDeviceId === selectedDeviceId) return;
      stopCamera();
      setSelectedDeviceId(newDeviceId);
      await startCamera(newDeviceId);
    },
    [selectedDeviceId, startCamera, stopCamera]
  );

  // Frame grabber interval
  useEffect(() => {
    if (status !== 'active' || !onFrame) {
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
        frameTimerRef.current = null;
      }
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const intervalMs = Math.round(1000 / targetFps);

    frameTimerRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.65);
      onFrame(base64, video);
    }, intervalMs);

    return () => {
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
        frameTimerRef.current = null;
      }
    };
  }, [status, onFrame, targetFps]);

  // Handle visibility change (tab backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (status === 'active') {
          // Pause processing when tab is hidden to save power
          if (frameTimerRef.current) {
            clearInterval(frameTimerRef.current);
            frameTimerRef.current = null;
          }
          setStatus('paused');
        }
      } else {
        if (status === 'paused' && streamRef.current) {
          setStatus('active');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);

  // Device disconnect listener
  useEffect(() => {
    const handleDeviceChange = async () => {
      const updated = await cameraService.getAvailableCameras();
      setDevices(updated);
      if (status === 'active' && selectedDeviceId) {
        const stillPresent = updated.some((d) => d.deviceId === selectedDeviceId);
        if (!stillPresent) {
          stopCamera();
          setError({
            type: 'DEVICE_NOT_FOUND',
            message: 'Active camera device was disconnected.',
            actionableHint: 'Select another connected camera.',
          });
        }
      }
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [status, selectedDeviceId, stopCamera]);

  // Clean cleanup on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    status,
    devices,
    selectedDeviceId,
    error,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    isActive: status === 'active',
  };
}
