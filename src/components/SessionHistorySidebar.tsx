import { useState } from 'react';
import { History, X, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChatSession } from '@/hooks/useChatSessions';

interface SessionHistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onClearSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SessionHistorySidebar = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onClearSession,
  onDeleteSession,
}: SessionHistorySidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleClearClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSessionId(sessionId);
    setClearDialogOpen(true);
  };

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSessionId(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleClearConfirm = () => {
    if (selectedSessionId) {
      onClearSession(selectedSessionId);
    }
    setClearDialogOpen(false);
    setSelectedSessionId(null);
  };

  const handleDeleteConfirm = () => {
    if (selectedSessionId) {
      onDeleteSession(selectedSessionId);
    }
    setDeleteDialogOpen(false);
    setSelectedSessionId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <History className="h-5 w-5" />
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Chat History
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <p>No chat history yet</p>
                  <p className="text-sm">Start a new conversation!</p>
                </div>
              ) : (
                <div className="p-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                        session.id === currentSessionId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      onClick={() => {
                        onSessionSelect(session.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-sm">
                            {session.title}
                          </h3>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDate(session.updated_at)}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleClearClick(session.id, e)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleDeleteClick(session.id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat Messages?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will permanently delete all messages in this chat session.
              The chat title will remain in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearConfirm}>
              Clear Messages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will permanently delete this chat session and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
