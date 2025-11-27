import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Strip emojis from text before speaking
const stripEmojis = (text: string) => {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAC5}\u{1FAD0}-\u{1FAD9}\u{1FAE0}-\u{1FAE7}]/gu, '');
};

export const useVoiceConversationFree = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

          // Use ElevenLabs TTS for Nepali-accented voice
          const cleanText = stripEmojis(aiResponse);
          console.log('Generating speech with ElevenLabs...');
          
          const { data: ttsData, error: ttsError } = await supabase.functions.invoke('elevenlabs-tts', {
            body: { 
              text: cleanText,
              // Use your cloned Nepali voice ID here when available
              // voiceId: 'YOUR_NEPALI_VOICE_ID'
            }
          });

          console.log('ElevenLabs TTS response:', { ttsData, ttsError });

          if (ttsError || !ttsData?.audioContent) {
            console.error('TTS failed:', ttsError);
            throw new Error(ttsError?.message || 'Failed to generate speech');
          }

          // Play the audio
          const audioBlob = new Blob(
            [Uint8Array.from(atob(ttsData.audioContent), c => c.charCodeAt(0))],
            { type: 'audio/mpeg' }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audio.onplay = () => {
            console.log('Audio playback started');
            setIsSpeaking(true);
            setIsProcessing(false);
            setTranscript(aiResponse);
          };

          audio.onended = () => {
            console.log('Audio playback ended');
            setIsSpeaking(false);
            setTranscript('');
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            setIsSpeaking(false);
            setIsProcessing(false);
            URL.revokeObjectURL(audioUrl);
            toast({
              title: "Error",
              description: "Failed to play audio response",
              variant: "destructive",
            });
          };

          audio.play();
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
    // Stop any playing audio
    const audios = document.getElementsByTagName('audio');
    for (let i = 0; i < audios.length; i++) {
      audios[i].pause();
      audios[i].currentTime = 0;
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
