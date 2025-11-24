import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize anonymous auth and load sessions
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      // Check if user is already authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        setUserId(data.user?.id || null);
      } else {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to initialize session',
        variant: 'destructive',
      });
    }
  };

  // Load sessions when user is available
  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      
      // If no current session and sessions exist, set the most recent one
      if (!currentSessionId && data && data.length > 0) {
        setCurrentSessionId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const typedMessages: ChatMessage[] = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
      }));
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const createNewSession = async (): Promise<string | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: 'New Chat',
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadSessions();
      setCurrentSessionId(data.id);
      setMessages([]);
      
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new chat',
        variant: 'destructive',
      });
      return null;
    }
  };

  const saveMessage = async (
    role: 'user' | 'assistant',
    content: string,
    sessionId?: string
  ): Promise<boolean> => {
    const targetSessionId = sessionId || currentSessionId;
    
    if (!targetSessionId) {
      const newSessionId = await createNewSession();
      if (!newSessionId) return false;
      return saveMessage(role, content, newSessionId);
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: targetSessionId,
          role,
          content,
        });

      if (error) throw error;

      // Update session title if this is the first user message
      if (role === 'user' && messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
          .from('chat_sessions')
          .update({ title })
          .eq('id', targetSessionId);
        await loadSessions();
      }

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', targetSessionId);

      // Reload messages to show the new one
      await loadMessages(targetSessionId);
      
      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: 'Error',
        description: 'Failed to save message',
        variant: 'destructive',
      });
      return false;
    }
  };

  const clearSession = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;

      // Reload messages if this is the current session
      if (sessionId === currentSessionId) {
        setMessages([]);
      }

      toast({
        title: 'Chat Cleared',
        description: 'All messages have been deleted',
      });

      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteSession = async (sessionId: string): Promise<boolean> => {
    try {
      // Messages will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // If we deleted the current session, create a new one
      if (sessionId === currentSessionId) {
        await createNewSession();
      }

      await loadSessions();

      toast({
        title: 'Session Deleted',
        description: 'Chat session has been removed',
      });

      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
      return false;
    }
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return {
    sessions,
    currentSessionId,
    messages,
    loading,
    userId,
    createNewSession,
    saveMessage,
    clearSession,
    deleteSession,
    switchSession,
    loadSessions,
  };
};
