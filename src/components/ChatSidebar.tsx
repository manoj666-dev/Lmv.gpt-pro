import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Volume2, VolumeX, History, ShieldCheck, ShieldOff, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface ChatSidebarProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
}

export const ChatSidebar = ({ 
  voiceEnabled, 
  onToggleVoice, 
  privacyMode,
  onTogglePrivacy,
}: ChatSidebarProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-64 bg-muted border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          LMv.GPT
        </h1>
        <p className="text-xs text-muted-foreground mt-1">AI Assistant</p>
      </div>

      <div className="flex-1 p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="voice-toggle" className="flex items-center gap-2 text-sm">
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Voice Output
            </Label>
            <Switch
              id="voice-toggle"
              checked={voiceEnabled}
              onCheckedChange={onToggleVoice}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle" className="flex items-center gap-2 text-sm">
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Dark Mode
            </Label>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="privacy-toggle" className="flex items-center gap-2 text-sm">
              {privacyMode ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
              Privacy Mode
            </Label>
            <Switch
              id="privacy-toggle"
              checked={privacyMode}
              onCheckedChange={onTogglePrivacy}
            />
          </div>
        </div>
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
