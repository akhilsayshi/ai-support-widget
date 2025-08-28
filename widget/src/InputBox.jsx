import React, { useState, useRef, useEffect } from 'react';

const InputBox = ({ onSendMessage, config, disabled }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e) => {
    // Handle paste events for large text
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 1000) {
      e.preventDefault();
      alert('Message is too long. Please keep it under 1000 characters.');
    }
  };

  // Quick action buttons for common queries
  const quickActions = [
    { label: 'Pricing', message: 'What are your pricing plans?' },
    { label: 'Features', message: 'What features do you offer?' },
    { label: 'Support', message: 'How can I get help?' },
    { label: 'Demo', message: 'Can I see a demo?' }
  ];

  const [showQuickActions, setShowQuickActions] = useState(message.length === 0);

  useEffect(() => {
    setShowQuickActions(message.length === 0 && !isFocused);
  }, [message.length, isFocused]);

  return (
    <div className="input-container">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="quick-actions">
          <div className="quick-actions-label">Quick questions:</div>
          <div className="quick-actions-buttons">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-button"
                onClick={() => onSendMessage(action.message)}
                disabled={disabled}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`input-area ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}>
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={disabled ? 'Please wait...' : config.placeholderText}
            disabled={disabled}
            maxLength={1000}
            rows={1}
            className="message-input"
          />
          
          {/* Character count */}
          {message.length > 800 && (
            <div className="character-count">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Attachment button (placeholder for future file upload) */}
        <button
          className="attachment-button"
          title="Attach file (coming soon)"
          disabled={true}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.64 16.2a2 2 0 01-2.83-2.83l8.49-8.49"/>
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="send-button"
          title="Send message"
        >
          {disabled ? (
            <div className="loading-spinner">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Powered by (optional branding) */}
      <div className="powered-by">
        <span>Powered by AI Support Widget</span>
      </div>

      <style jsx>{`
        .input-container {
          padding: 16px;
          border-top: 1px solid ${config.theme === 'dark' ? '#374151' : '#e5e7eb'};
          background: ${config.theme === 'dark' ? '#1f2937' : 'white'};
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }

        .quick-actions {
          margin-bottom: 12px;
          animation: slideUp 0.3s ease-out;
        }

        .quick-actions-label {
          font-size: 12px;
          color: ${config.theme === 'dark' ? '#9ca3af' : '#6b7280'};
          margin-bottom: 8px;
          font-weight: 500;
        }

        .quick-actions-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .quick-action-button {
          background: ${config.theme === 'dark' ? '#374151' : '#f3f4f6'};
          border: 1px solid ${config.theme === 'dark' ? '#4b5563' : '#d1d5db'};
          color: ${config.theme === 'dark' ? '#f3f4f6' : '#374151'};
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .quick-action-button:hover:not(:disabled) {
          background: ${config.primaryColor};
          color: white;
          border-color: ${config.primaryColor};
          transform: translateY(-1px);
        }

        .quick-action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-area {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          border: 2px solid ${config.theme === 'dark' ? '#374151' : '#e5e7eb'};
          border-radius: 12px;
          padding: 8px;
          background: ${config.theme === 'dark' ? '#374151' : '#f9fafb'};
          transition: all 0.2s ease;
        }

        .input-area.focused {
          border-color: ${config.primaryColor};
          background: ${config.theme === 'dark' ? '#1f2937' : 'white'};
          box-shadow: 0 0 0 3px ${config.primaryColor}20;
        }

        .input-area.disabled {
          opacity: 0.7;
        }

        .input-wrapper {
          flex: 1;
          position: relative;
        }

        .message-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: ${config.theme === 'dark' ? '#f3f4f6' : '#374151'};
          font-size: 14px;
          line-height: 1.4;
          resize: none;
          font-family: inherit;
          min-height: 20px;
          max-height: 120px;
        }

        .message-input::placeholder {
          color: ${config.theme === 'dark' ? '#6b7280' : '#9ca3af'};
        }

        .message-input:disabled {
          cursor: not-allowed;
        }

        .character-count {
          position: absolute;
          bottom: -18px;
          right: 0;
          font-size: 10px;
          color: ${config.theme === 'dark' ? '#6b7280' : '#9ca3af'};
        }

        .attachment-button {
          background: none;
          border: none;
          color: ${config.theme === 'dark' ? '#6b7280' : '#9ca3af'};
          cursor: not-allowed;
          padding: 6px;
          border-radius: 6px;
          transition: color 0.2s ease;
          opacity: 0.5;
        }

        .send-button {
          background: ${config.primaryColor};
          border: none;
          color: white;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          height: 34px;
        }

        .send-button:hover:not(:disabled) {
          background: ${config.primaryColor}dd;
          transform: translateY(-1px);
        }

        .send-button:disabled {
          background: ${config.theme === 'dark' ? '#4b5563' : '#d1d5db'};
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        .powered-by {
          margin-top: 8px;
          text-align: center;
          font-size: 10px;
          color: ${config.theme === 'dark' ? '#6b7280' : '#9ca3af'};
          opacity: 0.8;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .input-container {
            padding: 12px;
          }

          .quick-actions-buttons {
            gap: 4px;
          }

          .quick-action-button {
            font-size: 11px;
            padding: 4px 8px;
          }

          .message-input {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
};

export default InputBox;
