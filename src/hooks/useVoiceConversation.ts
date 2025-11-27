import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useVoiceConversation = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('Listening...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, []);

  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        setIsProcessing(true);
        setTranscript('Processing...');

        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];

            // Send to speech-to-text
            const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke(
              'speech-to-text',
              { body: { audio: base64Audio } }
            );

            if (transcriptionError || !transcriptionData?.text) {
              throw new Error('Failed to transcribe audio');
            }

            const userText = transcriptionData.text;
            setTranscript(userText);

            // Send to chat
            const { data: chatData, error: chatError } = await supabase.functions.invoke('chat', {
              body: { message: userText, conversationHistory: [] }
            });

            if (chatError || !chatData?.response) {
              throw new Error('Failed to get AI response');
            }

            const aiResponse = chatData.response;

            // Convert AI response to speech
            const { data: ttsData, error: ttsError } = await supabase.functions.invoke(
              'text-to-speech',
              { body: { text: aiResponse, voice: 'alloy' } }
            );

            if (ttsError || !ttsData?.audioContent) {
              throw new Error('Failed to generate speech');
            }

            // Play the audio
            const audioBlob = new Blob(
              [Uint8Array.from(atob(ttsData.audioContent), c => c.charCodeAt(0))],
              { type: 'audio/mp3' }
            );
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (audioElementRef.current) {
              audioElementRef.current.pause();
              audioElementRef.current.src = '';
            }

            const audio = new Audio(audioUrl);
            audioElementRef.current = audio;
            
            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              setTranscript('');
            };
            audio.onerror = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              toast({
                title: "Error",
                description: "Failed to play audio response",
                variant: "destructive",
              });
            };

            await audio.play();
            setIsProcessing(false);
            setTranscript(aiResponse);

          };
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

        resolve();
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      setIsSpeaking(false);
      setTranscript('');
    }
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
