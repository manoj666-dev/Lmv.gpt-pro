import { Search, PenSquare, Library, Grid2x2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSession } from "@/hooks/useChatSessions";

interface ModernSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export const ModernSidebar = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
}: ModernSidebarProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 left-0 bottom-0 w-80 bg-background border-r border-border z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-10 bg-muted/50 border-border/50 rounded-full"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="ml-2 h-10 w-10 rounded-full"
            >
              <PenSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-2 h-10 w-10 rounded-full"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Button>
          </div>

          {/* Menu items */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg"
              onClick={onNewChat}
            >
              <PenSquare className="h-5 w-5 mr-3" />
              New chat
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-lg">
              <Library className="h-5 w-5 mr-3" />
              Library
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-lg">
              <Grid2x2 className="h-5 w-5 mr-3" />
              GPTs
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-lg">
              <FolderPlus className="h-5 w-5 mr-3" />
              New project
            </Button>
          </div>
        </div>

        {/* Sessions list */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 pb-4">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onSessionSelect(session.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors ${
                  currentSessionId === session.id ? "bg-muted" : ""
                }`}
              >
                <div className="text-sm truncate">{session.title}</div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* User profile placeholder */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start rounded-lg">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-primary-foreground">MA</span>
            </div>
            <span className="text-sm">manoj Bhandari</span>
          </Button>
        </div>
      </div>
    </>
  );
};
