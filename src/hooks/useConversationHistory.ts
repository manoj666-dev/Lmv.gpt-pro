import { useState, useEffect } from 'react';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ConversationSession {
  id: string;
  messages: HistoryMessage[];
  createdAt: number;
  lastUpdated: number;
}

const MAX_MESSAGES_PER_SESSION = 20;
const STORAGE_KEY = 'lmvgpt_conversations';
const PRIVACY_MODE_KEY = 'lmvgpt_privacy_mode';

export const useConversationHistory = () => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [privacyMode, setPrivacyMode] = useState(false);

  // Load sessions and privacy mode from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const privacyStored = localStorage.getItem(PRIVACY_MODE_KEY);
    
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load conversation history:', e);
      }
    }
    
    if (privacyStored) {
      setPrivacyMode(privacyStored === 'true');
    }

    // Create or get current session
    const sessionId = Date.now().toString();
    setCurrentSessionId(sessionId);
  }, []);

  // Save to local storage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save privacy mode
  useEffect(() => {
    localStorage.setItem(PRIVACY_MODE_KEY, String(privacyMode));
  }, [privacyMode]);

  const addMessage = (message: HistoryMessage) => {
    if (privacyMode) return;

    setSessions(prev => {
      const existingSessionIndex = prev.findIndex(s => s.id === currentSessionId);
      
      if (existingSessionIndex >= 0) {
        // Update existing session
        const updatedSessions = [...prev];
        const session = { ...updatedSessions[existingSessionIndex] };
        session.messages = [...session.messages, message].slice(-MAX_MESSAGES_PER_SESSION);
        session.lastUpdated = Date.now();
        updatedSessions[existingSessionIndex] = session;
        return updatedSessions;
      } else {
        // Create new session
        const newSession: ConversationSession = {
          id: currentSessionId,
          messages: [message],
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        };
        return [...prev, newSession];
      }
    });
  };

  const getCurrentSession = (): ConversationSession | undefined => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const searchMessages = (query: string): HistoryMessage[] => {
    const lowerQuery = query.toLowerCase();
    const allMessages: HistoryMessage[] = [];
    
    sessions.forEach(session => {
      session.messages.forEach(msg => {
        if (msg.content.toLowerCase().includes(lowerQuery)) {
          allMessages.push(msg);
        }
      });
    });
    
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const clearAllHistory = () => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(prev => !prev);
  };

  const exportChat = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const text = session.messages
      .map(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        const speaker = msg.role === 'user' ? 'You' : 'LMv.GPT';
        return `[${time}] ${speaker}: ${msg.content}`;
      })
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lmvgpt-chat-${new Date(session.createdAt).toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startNewSession = () => {
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
  };

  return {
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
  };
};
