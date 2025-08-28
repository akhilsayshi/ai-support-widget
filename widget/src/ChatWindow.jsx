import React, { useState, useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import InputBox from './InputBox';

const ChatWindow = ({ config, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: config.greetingMessage,
      isUser: false,
      timestamp: new Date(),
      type: 'greeting'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(Math.random().toString(36).substr(2, 9));

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Send message to API
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      type: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId.current,
          user_id: getUserId()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add bot response
      const botMessage = {
        id: messages.length + 2,
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        type: data.type || 'bot',
        confidence: data.confidence
      };

      setMessages(prev => [...prev, botMessage]);

      // Play sound if enabled
      if (config.enableSound) {
        playNotificationSound();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact our support team directly.",
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get or generate user ID for session tracking
  const getUserId = () => {
    let userId = localStorage.getItem('ai-widget-user-id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ai-widget-user-id', userId);
    }
    return userId;
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+Pus2QdAzaGy/LNeSsF');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (browser might block autoplay)
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([
      {
        id: 1,
        text: config.greetingMessage,
        isUser: false,
        timestamp: new Date(),
        type: 'greeting'
      }
    ]);
    sessionId.current = Math.random().toString(36).substr(2, 9);
  };

  return (
    <div className="chat-window-container">
      {/* Header */}
      <div 
        className="chat-header"
        style={{ backgroundColor: config.primaryColor }}
      >
        <div className="chat-header-content">
          <div className="chat-header-info">
            {config.showAvatar && (
              <div className="chat-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9H21ZM19 21H5V3H13V9H19V21Z"/>
                </svg>
              </div>
            )}
            <div>
              <div className="chat-title">{config.title}</div>
              <div className="chat-status">
                <span className="status-indicator"></span>
                Online
              </div>
            </div>
          </div>
          
          <div className="chat-header-actions">
            <button
              onClick={clearConversation}
              className="header-button"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
            
            <button
              onClick={onClose}
              className="header-button close-button"
              title="Close chat"
              aria-label="Close chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            config={config}
          />
        ))}
        
        {isLoading && (
          <div className="loading-message">
            <div className="loading-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputBox
        onSendMessage={sendMessage}
        config={config}
        disabled={isLoading}
      />

      {/* Styles */}
      <style jsx>{`
        .chat-window-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: ${config.theme === 'dark' ? '#1f2937' : 'white'};
        }

        .chat-header {
          padding: 16px;
          color: white;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .chat-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-title {
          font-weight: 600;
          font-size: 14px;
        }

        .chat-status {
          font-size: 12px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-indicator {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
        }

        .chat-header-actions {
          display: flex;
          gap: 8px;
        }

        .header-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .header-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .messages-container {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: ${config.theme === 'dark' ? '#111827' : '#f9fafb'};
        }

        .loading-message {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 12px;
        }

        .loading-bubble {
          background: ${config.theme === 'dark' ? '#374151' : 'white'};
          padding: 12px 16px;
          border-radius: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          max-width: 70%;
          border: 1px solid ${config.theme === 'dark' ? '#4b5563' : '#e5e7eb'};
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: ${config.theme === 'dark' ? '#9ca3af' : '#6b7280'};
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .messages-container::-webkit-scrollbar {
          width: 4px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;
