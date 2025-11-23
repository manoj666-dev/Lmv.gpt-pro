import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Trash2, Download, X, MessageSquare } from "lucide-react";
import { ConversationSession, HistoryMessage } from "@/hooks/useConversationHistory";
import { cn } from "@/lib/utils";

interface HistoryPanelProps {
  sessions: ConversationSession[];
  currentSessionId: string;
  onSearch: (query: string) => HistoryMessage[];
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  onExport: (sessionId: string) => void;
  onClose: () => void;
  onLoadSession: (messages: HistoryMessage[]) => void;
}

export const HistoryPanel = ({
  sessions,
  currentSessionId,
  onSearch,
  onDeleteSession,
  onClearAll,
  onExport,
  onClose,
  onLoadSession,
}: HistoryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HistoryMessage[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = onSearch(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleLoadSession = (session: ConversationSession) => {
    onLoadSession(session.messages);
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          onClick={onClearAll} 
          variant="destructive" 
          size="sm" 
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All History
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        {showSearchResults ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Search Results ({searchResults.length})</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSearchResults(false)}
              >
                Back
              </Button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages found</p>
            ) : (
              searchResults.map((msg, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-secondary/50 text-sm">
                  <div className="font-medium mb-1 text-xs text-muted-foreground">
                    {msg.role === 'user' ? 'You' : 'LMv.GPT'} • {new Date(msg.timestamp).toLocaleString()}
                  </div>
                  <p className="text-foreground break-words">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversation history yet
              </p>
            ) : (
              sessions.slice().reverse().map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors",
                    session.id === currentSessionId && "bg-secondary/50 border-primary"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()} • {session.messages.length} messages
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 text-foreground">
                        {session.messages[0]?.content || 'Empty conversation'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadSession(session)}
                      className="flex-1"
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onExport(session.id)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteSession(session.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
