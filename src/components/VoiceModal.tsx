import { useEffect, useState } from "react";
import { X, Mic, Volume2, Settings, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  onToggleListening: () => void;
}

export const VoiceModal = ({ isOpen, onClose, isListening, onToggleListening }: VoiceModalProps) => {
  const [pulseScale, setPulseScale] = useState(1);

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
        >
          <Subtitles className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-muted/50"
        >
          <Volume2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-muted/50"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Center orb */}
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-cyan-500/30 blur-xl"
          style={{
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.5s ease-in-out'
          }}
        />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-32">
        <Button
          onClick={onToggleListening}
          size="icon"
          className={`h-20 w-20 rounded-full ${isListening ? 'bg-primary animate-pulse' : 'bg-muted'}`}
        >
          <Mic className="h-8 w-8" />
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-20 w-20 rounded-full bg-muted/50"
        >
          <X className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};
