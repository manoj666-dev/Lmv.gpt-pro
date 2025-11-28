import { useState, useRef, useEffect } from 'react';

export const useVoiceOutput = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Strip emojis and emoji names from text before speaking
  const stripEmojis = (text: string) => {
    // Remove emojis using regex
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAC5}\u{1FAD0}-\u{1FAD9}\u{1FAE0}-\u{1FAE7}]/gu, '');
  };

  const speak = (text: string) => {
    if (!isEnabled || !text) return;

    // If already speaking, stop it
    if (isSpeaking) {
      stop();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip emojis from text before speaking
    const cleanText = stripEmojis(text);

    utteranceRef.current = new SpeechSynthesisUtterance(cleanText);
    
    // Set Alex voice if available
    const alexVoice = voices.find(voice => voice.name.includes('Alex'));
    if (alexVoice) {
      utteranceRef.current.voice = alexVoice;
    }
    
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
