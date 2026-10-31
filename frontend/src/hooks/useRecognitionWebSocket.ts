import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { RecognitionMessage } from '../types';
import { clientMediaPipeEngine } from '../services/mediapipe/clientMediaPipeEngine';

export function useRecognitionWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const sessionIdRef = useRef<string>(
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem('insight_session_id') ||
        (() => {
          const id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          window.sessionStorage.setItem('insight_session_id', id);
          return id;
        })()
      : 'sess_default'
  );

  const {
    isPaused,
    addToken,
    activeLanguage,
  } = useStore();

  // Prewarm client-side MediaPipe WASM model in background
  useEffect(() => {
    clientMediaPipeEngine.initialize().catch(() => {});
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.info(
        '[WebSocket] Operating in client-side MediaPipe mode (Vercel Serverless / offline compatible).'
      );
      return;
    }

    // Determine WebSocket base URL (supports external inference server via VITE_WS_URL)
    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    let wsUrl: string;

    if (envWsUrl) {
      const cleanBase = String(envWsUrl).replace(/\/$/, '').replace(/^http/, 'ws');
      wsUrl = `${cleanBase}/ws/recognition?session_id=${sessionIdRef.current}&language=${activeLanguage}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws/recognition?session_id=${sessionIdRef.current}&language=${activeLanguage}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected: session=${sessionIdRef.current}, lang=${activeLanguage}, url=${wsUrl}`);
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: RecognitionMessage = JSON.parse(event.data);
          if (data.type === 'recognition_result') {
            useStore.setState({
              handsDetected: data.hands_detected,
              leftHand: data.left_hand,
              rightHand: data.right_hand,
              currentLabel: data.label,
              rawLabel: data.raw_label,
              confidence: data.confidence,
              isStable: data.is_stable,
              fps: data.fps,
              latencyMs: data.latency_ms,
              annotatedFrame: data.annotated_frame || null,
            });

            // If a new stable word was emitted, add it to the sentence tokens buffer
            if (data.new_word_emitted && !isPaused) {
              addToken(data.new_word_emitted, data.confidence || 0.95);
            }
          }
        } catch (err) {
          console.error('[WebSocket] Parse error:', err);
        }
      };

      ws.onclose = (event) => {
        if (event.wasClean) {
          console.log('[WebSocket] Connection closed cleanly.');
        } else {
          reconnectAttemptRef.current += 1;
          if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
            const backoffDelay = Math.min(
              1000 * Math.pow(1.5, reconnectAttemptRef.current),
              8000
            );
            reconnectTimeoutRef.current = window.setTimeout(connect, backoffDelay);
          } else {
            console.info('[WebSocket] Running in client-side MediaPipe WASM mode (Vercel Serverless / standalone).');
          }
        }
      };

      ws.onerror = () => {
        // Fallback to client-side MediaPipe without spamming error alerts
        ws.close();
      };
    } catch (e) {
      console.warn('[WebSocket] Init fallback to client MediaPipe:', e);
    }
  }, [addToken, isPaused, activeLanguage]);

  // Initial connection and tab visibility handling
  useEffect(() => {
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          reconnectAttemptRef.current = 0;
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Frame sender with seamless client-side MediaPipe fallback
  const sendFrame = useCallback(
    (base64Image: string, videoElement?: HTMLVideoElement | null) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'frame',
            image: base64Image,
          })
        );
        return;
      }

      // Client-Side MediaPipe Engine execution
      if (videoElement && videoElement.readyState >= 2) {
        const result = clientMediaPipeEngine.processVideoFrame(videoElement, activeLanguage);
        if (result) {
          useStore.setState({
            handsDetected: result.hands_detected,
            leftHand: result.left_hand,
            rightHand: result.right_hand,
            currentLabel: result.label,
            rawLabel: result.raw_label,
            confidence: result.confidence,
            isStable: result.is_stable,
            fps: result.fps,
            latencyMs: result.latency_ms,
            annotatedFrame: result.annotated_frame,
          });

          if (result.new_word_emitted && !isPaused) {
            addToken(result.new_word_emitted, result.confidence || 0.90);
          }
        }
      }
    },
    [activeLanguage, isPaused, addToken]
  );

  // Language changer
  const sendLanguage = useCallback((lang: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'set_language',
          language: lang,
        })
      );
    }
  }, []);

  // Buffer reset
  const sendReset = useCallback(() => {
    clientMediaPipeEngine.reset();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reset' }));
    }
  }, []);

  return {
    sendFrame,
    sendLanguage,
    sendReset,
    resetBuffer: sendReset,
  };
}
