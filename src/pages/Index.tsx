import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";
import { SessionHistorySidebar } from "@/components/SessionHistorySidebar";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { useChatSessions } from "@/hooks/useChatSessions";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, isEnabled: voiceEnabled, toggleEnabled: toggleVoice } = useVoiceOutput();
  const {
    sessions,
    currentSessionId,
    messages: dbMessages,
    loading: sessionsLoading,
    createNewSession,
    saveMessage,
    clearSession,
    deleteSession,
    switchSession,
  } = useChatSessions();

  // Convert database messages to component format
  const messages: Message[] = dbMessages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: "user", content };
    setIsLoading(true);

    // Save user message to database
    await saveMessage('user', content);

    try {
      // Get conversation context (last 10 messages for AI)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: Date.now(),
      }));

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [...messages, userMessage],
          conversationHistory,
        },
      });

      if (error) throw error;

      // Save assistant response to database
      await saveMessage('assistant', data.message);

      // Speak the response if voice is enabled
      if (voiceEnabled) {
        speak(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      await saveMessage('assistant', "Sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    await createNewSession();
  };

  const handleClearSession = async (sessionId: string) => {
    await clearSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  const handleSessionSelect = (sessionId: string) => {
    switchSession(sessionId);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted">
      <ChatSidebar
        onToggleVoice={toggleVoice}
        voiceEnabled={voiceEnabled}
        onToggleHistory={() => {}}
        onTogglePrivacy={() => {}}
        privacyMode={false}
      />

      <div className="flex-1 flex flex-col">
        {/* Header with New Chat and History buttons */}
        <div className="border-b border-border bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>

            <SessionHistorySidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              onClearSession={handleClearSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center space-y-4 mt-20">
                <div className="text-6xl mb-4">🤖</div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Welcome to LMv.GPT
                </h1>
                <p className="text-muted-foreground text-lg">
                  Your AI companion for learning, problem-solving, and creativity
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={index} role={message.role} content={message.content} />
                ))}
                {isLoading && (
                  <div className="flex justify-center">
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto p-4">
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
