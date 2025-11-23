import { useState, useRef } from 'react';

export const useVoiceOutput = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string) => {
    if (!isEnabled || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = 1.0;
    utteranceRef.current.pitch = 1.0;
    utteranceRef.current.volume = 1.0;

    utteranceRef.current.onstart = () => {
      setIsSpeaking(true);
    };

    utteranceRef.current.onend = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utteranceRef.current);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleEnabled = () => {
    setIsEnabled(prev => !prev);
    if (isSpeaking) {
      stop();
    }
  };

  return {
    speak,
    stop,
    isSpeaking,
    isEnabled,
    toggleEnabled,
    isSupported: 'speechSynthesis' in window,
  };
};
