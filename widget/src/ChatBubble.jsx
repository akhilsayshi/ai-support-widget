import React from 'react';

const ChatBubble = ({ message, config }) => {
  const { text, isUser, timestamp, type, confidence } = message;

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getMessageIcon = () => {
    if (isUser) return null;
    
    switch (type) {
      case 'faq':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="message-icon">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'rag':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="message-icon">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="message-icon error">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="message-icon">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        );
    }
  };

  const getConfidenceColor = () => {
    if (!confidence || isUser) return '';
    
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.5) return 'medium-confidence';
    return 'low-confidence';
  };

  const shouldShowMetadata = () => {
    return !isUser && (type !== 'greeting') && confidence !== undefined;
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'bot'}`}>
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'} ${type || ''}`}>
        {!isUser && getMessageIcon() && (
          <div className="message-header">
            {getMessageIcon()}
            <span className="message-type">{type?.toUpperCase()}</span>
          </div>
        )}
        
        <div className="message-content">
          {text}
        </div>
        
        <div className="message-footer">
          <span className="message-time">{formatTime(timestamp)}</span>
          
          {shouldShowMetadata() && (
            <div className="message-metadata">
              <span className={`confidence-indicator ${getConfidenceColor()}`}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .message-wrapper {
          display: flex;
          margin-bottom: 12px;
          animation: slideInMessage 0.3s ease-out;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message-wrapper.bot {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          word-wrap: break-word;
          font-size: 14px;
          line-height: 1.4;
          position: relative;
        }

        .user-bubble {
          background: ${config.primaryColor};
          color: white;
          margin-left: 20px;
          border-bottom-right-radius: 8px;
        }

        .bot-bubble {
          background: white;
          color: #374151;
          margin-right: 20px;
          border-bottom-left-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .bot-bubble.error {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }

        .message-icon {
          opacity: 0.8;
        }

        .message-icon.error {
          color: #dc2626;
        }

        .message-content {
          margin-bottom: 8px;
          white-space: pre-wrap;
        }

        .message-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.6;
          font-weight: 400;
        }

        .message-metadata {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .confidence-indicator {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .high-confidence {
          background: #d1fae5;
          color: #065f46;
        }

        .medium-confidence {
          background: #fef3c7;
          color: #92400e;
        }

        .low-confidence {
          background: #fee2e2;
          color: #991b1b;
        }

        @keyframes slideInMessage {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Dark theme adjustments */
        ${config.theme === 'dark' ? `
          .bot-bubble {
            background: #374151;
            color: #f3f4f6;
            border-color: #4b5563;
          }

          .bot-bubble.error {
            background: #7f1d1d;
            border-color: #991b1b;
            color: #fecaca;
          }

          .message-time {
            color: #9ca3af;
          }
        ` : ''}

        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .message-bubble {
            max-width: 85%;
            font-size: 13px;
          }

          .user-bubble {
            margin-left: 10px;
          }

          .bot-bubble {
            margin-right: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatBubble;
