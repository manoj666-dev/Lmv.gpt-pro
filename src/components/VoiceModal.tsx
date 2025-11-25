import { useEffect, useState } from "react";
import { X, Mic, Volume2, Settings, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  transcript?: string;
}

export const VoiceModal = ({ isOpen, onClose, isListening, onToggleListening, transcript }: VoiceModalProps) => {
  const [pulseScale, setPulseScale] = useState(1);
  const { isEnabled, toggleEnabled, isSpeaking } = useVoiceOutput();

  useEffect(() => {
    if (!isListening) return;
    
    const interval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.1 : 1);
    }, 500);
    
    return () => clearInterval(interval);
  }, [isListening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-muted/50"
          disabled
        >
          <Subtitles className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-full ${isEnabled ? 'bg-primary/20' : 'bg-muted/50'}`}
          onClick={toggleEnabled}
        >
          <Volume2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-muted/50"
          disabled
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Center orb and transcript */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div 
          className={`w-64 h-64 rounded-full blur-xl transition-all duration-500 ${
            isListening 
              ? 'bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20' 
              : isSpeaking 
              ? 'bg-gradient-to-br from-accent/40 via-accent/30 to-accent/20'
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
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-32">
        <Button
          onClick={onToggleListening}
          size="icon"
          className={`h-20 w-20 rounded-full transition-all ${
            isListening 
              ? 'bg-primary hover:bg-primary/90 animate-pulse' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <Mic className="h-8 w-8" />
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
