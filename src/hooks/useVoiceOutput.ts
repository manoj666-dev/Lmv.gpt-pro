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

  // Strip emojis and markdown from text before speaking
  const stripForSpeech = (text: string) => {
    return text
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAC5}\u{1FAD0}-\u{1FAD9}\u{1FAE0}-\u{1FAE7}]/gu, '')
      // Remove markdown symbols (###, ##, #, ***, **, *)
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*{1,3}/g, '')
      .replace(/_+/g, '')
      .replace(/`+/g, '')
      .replace(/~+/g, '')
      .trim();
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

    // Strip emojis and markdown from text before speaking
    const cleanText = stripForSpeech(text);

    const speakNow = () => {
      const currentVoices = window.speechSynthesis.getVoices();
      console.log('Available voices for speak:', currentVoices.map(v => v.name));
      
      utteranceRef.current = new SpeechSynthesisUtterance(cleanText);
      
      // Find Alex voice specifically
      const alexVoice = currentVoices.find(voice => voice.name === 'Alex');
      
      if (alexVoice) {
        utteranceRef.current.voice = alexVoice;
        console.log('Using Alex voice');
      } else {
        console.warn('Alex voice not available');
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

    // Wait for voices if not loaded
    if (voices.length === 0) {
      setTimeout(speakNow, 100);
    } else {
      speakNow();
    }
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
