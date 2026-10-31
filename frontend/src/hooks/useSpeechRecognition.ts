import { useState, useEffect, useRef, useCallback } from 'react';

export type SpeechRecognitionError = 
  | 'not-allowed' 
  | 'no-speech' 
  | 'network' 
  | 'unsupported' 
  | 'aborted' 
  | null;

export interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: SpeechRecognitionError) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    language = 'en-IN',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionError>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => (prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim()));
          onResult?.(currentFinal.trim(), true);
        }
        setInterimTranscript(currentInterim);
        if (currentInterim) {
          onResult?.(currentInterim, false);
        }
      };

      recognition.onerror = (event: any) => {
        const errType: SpeechRecognitionError = event.error || 'network';
        setError(errType);
        setIsListening(false);
        setIsProcessing(false);
        onError?.(errType);
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('unsupported');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort errors
        }
      }
    };
  }, [language, continuous, interimResults, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setError(null);
      setIsProcessing(true);
      recognitionRef.current.start();
    } catch (e: any) {
      // If already started, ignore
      if (e.name !== 'InvalidStateError') {
        setError('network');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
