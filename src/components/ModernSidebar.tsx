import { Search, PenSquare, FolderPlus, MoreVertical, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSession } from "@/hooks/useChatSessions";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ModernSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onLogout: () => void;
  userName?: string;
  isPrivacyMode: boolean;
  onTogglePrivacyMode: () => void;
}

export const ModernSidebar = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onLogout,
  userName,
  isPrivacyMode,
  onTogglePrivacyMode,
}: ModernSidebarProps) => {
  const [longPressSession, setLongPressSession] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  if (!isOpen) return null;

  const handleLongPressStart = (sessionId: string) => {
    const timer = setTimeout(() => {
      setLongPressSession(sessionId);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleRename = () => {
    const session = sessions.find(s => s.id === longPressSession);
    if (session) {
      setNewTitle(session.title);
      setRenameDialogOpen(true);
    }
    setLongPressSession(null);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    setLongPressSession(null);
  };

  const confirmRename = () => {
    if (longPressSession && newTitle.trim()) {
      onRenameSession(longPressSession, newTitle.trim());
      setRenameDialogOpen(false);
      setNewTitle("");
    }
  };

  const confirmDelete = () => {
    if (longPressSession) {
      onDeleteSession(longPressSession);
      setDeleteDialogOpen(false);
      setLongPressSession(null);
    }
  };

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
            <Button 
              variant="ghost" 
              className={`w-full justify-start rounded-lg ${isPrivacyMode ? 'bg-muted text-primary' : ''}`}
              onClick={onTogglePrivacyMode}
            >
              <ShieldCheck className="h-5 w-5 mr-3" />
              Privacy mode {isPrivacyMode ? '(On)' : ''}
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-lg">
              <FolderPlus className="h-5 w-5 mr-3" />
              New project
            </Button>

            {/* History section under New Project */}
            <div className="pt-2">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setHistoryExpanded(!historyExpanded)}
              >
                <svg
                  className={`h-4 w-4 mr-2 transition-transform ${historyExpanded ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                History
              </Button>
            </div>
          </div>
        </div>

        {/* Sessions list */}
        <ScrollArea className="flex-1 px-4">
          {historyExpanded && (
            <div className="space-y-1 pb-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="relative group"
                  onTouchStart={() => handleLongPressStart(session.id)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(session.id)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  <button
                    onClick={() => {
                      onSessionSelect(session.id);
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors ${
                      currentSessionId === session.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm truncate flex-1">{session.title}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setLongPressSession(session.id);
                              handleRename();
                            }}
                          >
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setLongPressSession(session.id);
                              handleDelete();
                            }}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* User profile placeholder */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start rounded-lg">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-primary-foreground">
                {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm">{userName || userEmail}</span>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </Button>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for this chat session
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="session-title">Chat Title</Label>
            <Input
              id="session-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter chat title"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
