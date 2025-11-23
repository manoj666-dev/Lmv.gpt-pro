import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { useConversationHistory, HistoryMessage } from "@/hooks/useConversationHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { speak, isEnabled: voiceEnabled, toggleEnabled: toggleVoice, isSupported: voiceSupported } = useVoiceOutput();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    sessions,
    currentSessionId,
    privacyMode,
    addMessage,
    getCurrentSession,
    searchMessages,
    deleteSession,
    clearAllHistory,
    togglePrivacyMode,
    exportChat,
    startNewSession,
  } = useConversationHistory();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    const userHistoryMsg: HistoryMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    addMessage(userHistoryMsg);
    setIsLoading(true);

    // Get conversation context (last 20 messages from current session)
    const currentSession = getCurrentSession();
    const conversationContext = currentSession?.messages.slice(-20) || [];

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: newMessages,
          conversationHistory: conversationContext 
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message 
      };
      
      const assistantHistoryMsg: HistoryMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      addMessage(assistantHistoryMsg);

      // Speak the response if voice is enabled
      if (voiceEnabled && voiceSupported) {
        speak(data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSession = (historyMessages: HistoryMessage[]) => {
    const loadedMessages: Message[] = historyMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    setMessages(loadedMessages);
    startNewSession();
    toast({
      title: "Chat Loaded",
      description: "Previous conversation loaded successfully.",
    });
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setMessages([]);
    toast({
      title: "History Cleared",
      description: "All conversation history has been deleted.",
    });
  };

  const handleTogglePrivacy = () => {
    togglePrivacyMode();
    toast({
      title: privacyMode ? "Privacy Mode Off" : "Privacy Mode On",
      description: privacyMode 
        ? "Conversation history is now being saved." 
        : "New messages will not be saved to history.",
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar 
        voiceEnabled={voiceEnabled} 
        onToggleVoice={toggleVoice}
        onToggleHistory={() => setShowHistory(!showHistory)}
        privacyMode={privacyMode}
        onTogglePrivacy={handleTogglePrivacy}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Welcome to LMv.GPT
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Your multi-purpose AI assistant for coding, learning, writing, and reasoning.
                  Start a conversation below!
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>

      {showHistory && (
        <div className="w-80 md:w-96">
          <HistoryPanel
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSearch={searchMessages}
            onDeleteSession={deleteSession}
            onClearAll={handleClearAllHistory}
            onExport={exportChat}
            onClose={() => setShowHistory(false)}
            onLoadSession={handleLoadSession}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
