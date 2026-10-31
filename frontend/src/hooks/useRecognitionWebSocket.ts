import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { RecognitionMessage } from '../types';

export function useRecognitionWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
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

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/recognition?session_id=${sessionIdRef.current}&language=${activeLanguage}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WebSocket] Connected: session=${sessionIdRef.current}, lang=${activeLanguage}`);
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
            addToken(data.new_word_emitted, data.confidence);
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
        // Exponential backoff with jitter, capped at 10s
        const backoffDelay = Math.min(
          1000 * Math.pow(1.5, reconnectAttemptRef.current),
          10000
        );
        console.log(`[WebSocket] Disconnected. Reconnecting in ${Math.round(backoffDelay)}ms (attempt ${reconnectAttemptRef.current})...`);
        reconnectTimeoutRef.current = window.setTimeout(connect, backoffDelay);
      }
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err);
      ws.close();
    };
  }, [addToken, isPaused, activeLanguage]);

  // Initial connection and tab visibility handling
  useEffect(() => {
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
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

  // Sync language changes dynamically over the existing socket
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'set_language',
          language: activeLanguage,
        })
      );
    }
  }, [activeLanguage]);

  const sendFrame = useCallback((base64Image: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'frame',
          image: base64Image,
          timestamp: Date.now(),
        })
      );
    }
  }, []);

  const resetBuffer = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reset' }));
    }
  }, []);

  return { sendFrame, resetBuffer, sessionId: sessionIdRef.current };
}
