import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
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
  const { speak, isEnabled: voiceEnabled, toggleEnabled: toggleVoice, isSupported: voiceSupported } = useVoiceOutput();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: newMessages }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message 
      };
      
      setMessages(prev => [...prev, assistantMessage]);

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar voiceEnabled={voiceEnabled} onToggleVoice={toggleVoice} />
      
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
    </div>
  );
};

export default Index;
