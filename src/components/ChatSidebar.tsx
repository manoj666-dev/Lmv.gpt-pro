import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface ChatSidebarProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const ChatSidebar = ({ voiceEnabled, onToggleVoice }: ChatSidebarProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-64 bg-muted border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          LMv.GPT
        </h1>
        <p className="text-xs text-muted-foreground mt-1">AI Assistant</p>
      </div>

      <div className="flex-1 p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onToggleVoice}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className="mr-2 h-4 w-4" />
              Voice On
            </>
          ) : (
            <>
              <VolumeX className="mr-2 h-4 w-4" />
              Voice Off
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Dark Mode
            </>
          )}
        </Button>
      </div>

      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        <p>Multi-purpose AI for:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Coding assistance</li>
          <li>Question answering</li>
          <li>Creative writing</li>
          <li>Logical reasoning</li>
        </ul>
      </div>
    </div>
  );
};
