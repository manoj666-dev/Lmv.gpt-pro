import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

export const useVoiceConversationFree = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices when available
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        console.log('Voices loaded:', voices.map(v => v.name));
      }
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setTranscript('Listening...');
      };

      recognitionRef.current.onresult = async (event: any) => {
        const userText = event.results[0][0].transcript;
        console.log('Speech recognized:', userText);
        
        setIsRecording(false);
        setIsProcessing(true);
        setTranscript(userText);

        try {
          // Send to chat
          console.log('Sending to chat...');
          const { data: chatData, error: chatError } = await supabase.functions.invoke('chat', {
            body: { message: userText, conversationHistory: [] }
          });

          console.log('Chat response:', { chatData, chatError });

          if (chatError || !chatData?.response) {
            console.error('Chat failed:', chatError);
            throw new Error(chatError?.message || 'Failed to get AI response');
          }

          const aiResponse = chatData.response;
          console.log('AI response:', aiResponse);

          // Use browser's speech synthesis with Alex voice
          const cleanText = stripForSpeech(aiResponse);
          console.log('Generating speech with browser TTS...');
          
          setIsProcessing(false);
          
          // Wait for voices to be loaded before speaking
          const speakWithVoice = () => {
            // Cancel any ongoing speech first
            window.speechSynthesis.cancel();
            
            const voices = window.speechSynthesis.getVoices();
            console.log('All available voices:', voices.map(v => `${v.name} (${v.lang})`));
            
            // Try to find English India or Hindi India for Nepali-like accent, or English US as fallback
            const preferredVoice = voices.find(voice => 
              voice.lang === 'hi_IN' || voice.lang === 'hi-IN'
            ) || voices.find(voice => 
              voice.lang === 'en_IN' || voice.lang === 'en-IN'
            ) || voices.find(voice => 
              voice.lang === 'en_US' || voice.lang === 'en-US'
            ) || voices[0];
            
            console.log('Selected voice:', preferredVoice?.name || 'default');
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utteranceRef.current = utterance;
            
            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }

            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
              console.log('Speech started');
              setIsSpeaking(true);
              setTranscript(aiResponse);
            };

            utterance.onend = () => {
              console.log('Speech ended');
              setIsSpeaking(false);
            };

            utterance.onerror = (event) => {
              console.error('Speech error:', event);
              setIsSpeaking(false);
            };

            // Actually speak the text
            console.log('Starting speech synthesis...');
            window.speechSynthesis.speak(utterance);
          };
          
          // If voices not loaded yet, wait for them
          if (!voicesLoaded || window.speechSynthesis.getVoices().length === 0) {
            console.log('Waiting for voices to load...');
            const waitForVoices = setInterval(() => {
              if (window.speechSynthesis.getVoices().length > 0) {
                clearInterval(waitForVoices);
                speakWithVoice();
              }
            }, 100);
            
            // Timeout after 3 seconds
            setTimeout(() => {
              clearInterval(waitForVoices);
              speakWithVoice();
            }, 3000);
          } else {
            speakWithVoice();
          }
        } catch (error) {
          console.error('Error processing voice:', error);
          setIsProcessing(false);
          setTranscript('');
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to process voice",
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        toast({
          title: "Voice Input Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    // Stop speech synthesis
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (utteranceRef.current) {
      utteranceRef.current = null;
    }
    setIsSpeaking(false);
    setTranscript('');
  }, []);

  return {
    isRecording,
    isProcessing,
    isSpeaking,
    transcript,
    startRecording,
    stopRecording,
    stopSpeaking,
  };
};
