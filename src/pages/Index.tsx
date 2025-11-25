import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { useChatSessions } from "@/hooks/useChatSessions";
import { Button } from "@/components/ui/button";
import { Menu, UserPlus, RotateCcw, Moon, Sun } from "lucide-react";
import { ModernSidebar } from "@/components/ModernSidebar";
import { VoiceModal } from "@/components/VoiceModal";
import { QuickActions } from "@/components/QuickActions";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import aiLogo from "@/assets/ai-logo.jpeg";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { theme, setTheme } = useTheme();
  const { speak, isSpeaking, isEnabled: isVoiceEnabled } = useVoiceOutput();
  const { isListening, transcript, startListening, stopListening } = useVoiceInput();
  
  const {
    sessions,
    currentSessionId,
    messages: dbMessages,
    saveMessage,
    createNewSession,
    clearSession,
    deleteSession,
    switchSession,
    renameSession,
  } = useChatSessions();

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.first_name) {
          setUserName(profile.first_name);
        }
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (dbMessages.length > 0) {
      const formattedMessages: Message[] = dbMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
  }, [dbMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      await saveMessage('user', content, currentSessionId || undefined);

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          message: content,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.response 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage('assistant', data.response, currentSessionId || undefined);

      if (isVoiceEnabled) {
        speak(data.response);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    createNewSession();
    setMessages([]);
  };

  const handleClearSession = (sessionId: string) => {
    clearSession(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
  };

  const handleSessionSelect = (sessionId: string) => {
    switchSession(sessionId);
  };

  const handleQuickAction = (action: string) => {
    toast({
      title: action,
      description: "Feature coming soon!",
    });
  };

  const handleAttachFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: "File Selected",
          description: `${file.name} - File processing coming soon!`,
        });
      }
    };
    input.click();
  }, []);

  const handleToggleVoiceListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Handle voice input transcript
  useEffect(() => {
    if (transcript && !isListening && isVoiceModalOpen) {
      // Send the transcript as a message when voice recording stops
      handleSendMessage(transcript);
      setIsVoiceModalOpen(false);
    }
  }, [transcript, isListening, isVoiceModalOpen]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <img src={aiLogo} alt="AI Logo" className="h-8 w-8 object-contain rounded-full" />
          <div>
            <h1 className="text-lg font-bold leading-tight">LMV.GPT</h1>
            <p className="text-xs text-muted-foreground leading-tight">Powered by Laxmi School</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handleNewChat}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <h2 className="text-3xl font-semibold mb-12">What can I help with?</h2>
            <QuickActions onAction={handleQuickAction} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto pb-32">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  onSpeak={speak}
                  isSpeaking={isSpeaking}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onAttachFile={handleAttachFile}
      />

      {/* Sidebar */}
      <ModernSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={renameSession}
        onLogout={handleLogout}
        userName={userName}
      />

      {/* Voice Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => {
          setIsVoiceModalOpen(false);
          if (isListening) stopListening();
        }}
        isListening={isListening}
        onToggleListening={handleToggleVoiceListening}
        transcript={transcript}
      />
    </div>
  );
};

export default Index;
