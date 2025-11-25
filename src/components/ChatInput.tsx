import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Paperclip, Mic } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  onOpenVoiceModal: () => void;
  onAttachFile: () => void;
}

export const ChatInput = ({ onSendMessage, disabled, onOpenVoiceModal, onAttachFile }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={onAttachFile}
            disabled={disabled}
          >
            <Plus className="h-5 w-5" />
          </Button>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask LMV.GPT"
            disabled={disabled}
            className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
            rows={1}
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={onAttachFile}
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {message.trim() ? (
            <Button
              onClick={handleSend}
              disabled={disabled}
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={onOpenVoiceModal}
              disabled={disabled}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
