import { useEffect, useState } from "react";
import { X, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceConversationFree } from "@/hooks/useVoiceConversationFree";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceModal = ({ isOpen, onClose }: VoiceModalProps) => {
  const [pulseScale, setPulseScale] = useState(1);
  const {
    isRecording,
    isProcessing,
    isSpeaking,
    transcript,
    startRecording,
    stopRecording,
    stopSpeaking,
  } = useVoiceConversationFree();

  useEffect(() => {
    if (!isRecording && !isSpeaking) return;
    
    const interval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.2 : 1);
    }, 500);
    
    return () => clearInterval(interval);
  }, [isRecording, isSpeaking]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else if (isSpeaking) {
      stopSpeaking();
    } else {
      await startRecording();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Center orb and transcript */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div 
          className={`w-64 h-64 rounded-full blur-xl transition-all duration-500 ${
            isRecording 
              ? 'bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20' 
              : isSpeaking 
              ? 'bg-gradient-to-br from-accent/40 via-accent/30 to-accent/20'
              : isProcessing
              ? 'bg-gradient-to-br from-yellow-500/40 via-yellow-500/30 to-yellow-500/20'
              : 'bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10'
          }`}
          style={{
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.5s ease-in-out'
          }}
        />
        
        {transcript && (
          <div className="mt-8 text-center max-w-2xl">
            <p className="text-lg text-foreground">{transcript}</p>
          </div>
        )}

        {!transcript && !isRecording && !isProcessing && !isSpeaking && (
          <div className="mt-8 text-center max-w-2xl">
            <p className="text-lg text-muted-foreground">Press the microphone to start talking</p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-32">
        <Button
          onClick={handleToggleRecording}
          size="icon"
          disabled={isProcessing}
          className={`h-20 w-20 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : isSpeaking
              ? 'bg-accent hover:bg-accent/90'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {(isRecording || isSpeaking) ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-20 w-20 rounded-full bg-muted/50 hover:bg-muted/70"
        >
          <X className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};
