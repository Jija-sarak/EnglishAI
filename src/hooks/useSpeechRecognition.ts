import { useState, useRef, useCallback } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0];
      setTranscript(result.transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}