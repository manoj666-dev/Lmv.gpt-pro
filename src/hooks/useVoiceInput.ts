import { useState, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = "Could not recognize speech. Please try again.";
        
        if (event.error === 'network') {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
        } else if (event.error === 'no-speech') {
          errorMessage = "No speech detected. Please speak clearly into your microphone.";
        } else if (event.error === 'audio-capture') {
          errorMessage = "Microphone not found. Please connect a microphone and try again.";
        }
        
        toast({
          title: "Voice Input Error",
          description: errorMessage,
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, []);

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check microphone permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Microphone access error:', error);
      
      let errorMessage = "Could not access microphone.";
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
  };
};
