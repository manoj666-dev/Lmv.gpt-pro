import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Volume2, Copy, ThumbsUp, ThumbsDown, RotateCw } from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const ChatMessage = ({ role, content, onSpeak, isSpeaking }: ChatMessageProps) => {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak(content);
    }
  };

  return (
    <div className={cn(
      "flex w-full mb-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-500",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
        
        {!isUser && (
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSpeak}
              title="Read aloud"
            >
              <Volume2 className={cn("h-4 w-4", isSpeaking && "text-primary animate-pulse")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleCopy}
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              title="Good response"
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              title="Bad response"
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              title="Regenerate"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
