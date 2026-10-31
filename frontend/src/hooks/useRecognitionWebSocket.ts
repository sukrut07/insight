import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { RecognitionMessage } from '../types';

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

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.info(
        '[WebSocket] Reconnect limit reached. If deployed on Vercel serverless, please connect via dedicated inference backend (set VITE_WS_URL) or start local backend.'
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
            console.log(`[WebSocket] Disconnected. Reconnecting in ${Math.round(backoffDelay)}ms (attempt ${reconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            reconnectTimeoutRef.current = window.setTimeout(connect, backoffDelay);
          } else {
            console.warn('[WebSocket] Persistent recognition connection paused. Backend requires dedicated WebSocket server.');
          }
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket] Connection failed. Note: Vercel Serverless requires separate persistent WebSocket host (VITE_WS_URL).', err);
        ws.close();
      };
    } catch (e) {
      console.warn('[WebSocket] Initialization error:', e);
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

  // Frame sender
  const sendFrame = useCallback((base64Image: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'frame',
          image: base64Image,
        })
      );
    }
  }, []);

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
