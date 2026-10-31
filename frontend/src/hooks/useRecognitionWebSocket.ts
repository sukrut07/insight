import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { RecognitionMessage } from '../types';

export function useRecognitionWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const {
    isPaused,
    addToken,
  } = useStore();

  const connect = useCallback(() => {
    // Protocol matches page (ws: or wss:)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/recognition`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected to /ws/recognition');
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

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected. Reconnecting in 2s...');
      reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err);
      ws.close();
    };
  }, [addToken, isPaused]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

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

  return { sendFrame, resetBuffer };
}
