import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebcamOptions {
  onFrame?: (base64Image: string) => void;
  targetFps?: number;
  enabled?: boolean;
}

export function useWebcam({ onFrame, targetFps = 25, enabled = true }: UseWebcamOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const frameIntervalRef = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setPermissionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied in macOS/Browser settings. Please grant access in browser address bar.'
          : `Camera error: ${err.message || 'Device not accessible'}`
      );
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, [stream]);

  useEffect(() => {
    if (enabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [enabled, startCamera, stopCamera]);

  // Frame grabber loop
  useEffect(() => {
    if (!enabled || !stream || !onFrame) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const intervalMs = Math.round(1000 / targetFps);

    frameIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4 || !ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.65);
      onFrame(base64);
    }, intervalMs);

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [enabled, stream, onFrame, targetFps]);

  return {
    videoRef,
    stream,
    permissionError,
    isLoading,
    restartCamera: startCamera,
  };
}
