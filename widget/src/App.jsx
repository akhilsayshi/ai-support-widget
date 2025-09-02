import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import './widget.css';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [config, setConfig] = useState({
    apiUrl: 'http://localhost:3001/api',
    theme: 'light',
    primaryColor: '#3B82F6',
    position: 'bottom-right',
    greetingMessage: 'Hi! How can I help you today?',
    placeholderText: 'Type your message...',
    showAvatar: true,
    enableSound: false,
    title: 'Support Chat'
  });

  // Load configuration from parent window or props
  useEffect(() => {
    // Check if running in iframe and get config from parent
    if (window.parent !== window) {
      const urlParams = new URLSearchParams(window.location.search);
      const configParam = urlParams.get('config');
      
      if (configParam) {
        try {
          const parsedConfig = JSON.parse(decodeURIComponent(configParam));
          setConfig(prevConfig => ({ ...prevConfig, ...parsedConfig }));
        } catch (error) {
          console.warn('Invalid config parameter:', error);
        }
      }
    }

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('ai-widget-dark-mode');
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }

    // Listen for messages from parent window (for iframe communication)
    const handleMessage = (event) => {
      if (event.data.type === 'WIDGET_CONFIG') {
        setConfig(prevConfig => ({ ...prevConfig, ...event.data.config }));
      } else if (event.data.type === 'WIDGET_OPEN') {
        setIsOpen(true);
      } else if (event.data.type === 'WIDGET_CLOSE') {
        setIsOpen(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Apply theme styles
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--theme', isDarkMode ? 'dark' : 'light');
    
    // Apply data-theme attribute for CSS variables
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [config.primaryColor, isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('ai-widget-dark-mode', JSON.stringify(newDarkMode));
    
    // Update config theme for consistency
    setConfig(prevConfig => ({
      ...prevConfig,
      theme: newDarkMode ? 'dark' : 'light'
    }));
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    
    // Notify parent window if in iframe
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'WIDGET_TOGGLE',
        isOpen: !isOpen
      }, '*');
    }
  };

  const getPositionClasses = () => {
    const positions = {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4'
    };
    return positions[config.position] || positions['bottom-right'];
  };

  const getChatWindowPosition = () => {
    const isLeft = config.position.includes('left');
    const isTop = config.position.includes('top');
    
    return {
      [isTop ? 'top' : 'bottom']: '80px',
      [isLeft ? 'left' : 'right']: '0'
    };
  };

  return (
    <div className={`widget-container ${isDarkMode ? 'dark' : ''}`}>

      {/* Chat Button */}
      <button
        onClick={toggleWidget}
        className={`chat-button ${getPositionClasses()} ${isOpen ? 'open' : ''}`}
        style={{ backgroundColor: config.primaryColor }}
        aria-label="Open chat"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          {isOpen ? (
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`chat-window ${getPositionClasses()}`}
          style={getChatWindowPosition()}
        >
          <ChatWindow config={config} onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Global styles */}
      <style jsx global>{`
        .widget-container {
          position: fixed;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
        }

        .chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .chat-button.open {
          transform: rotate(180deg);
        }

        .chat-window {
          position: fixed;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .widget-container.dark .chat-window {
          background: #1f2937;
          border-color: #374151;
        }

        @media (max-width: 640px) {
          .chat-window {
            width: calc(100vw - 32px);
            height: calc(100vh - 100px);
            max-width: 350px;
            max-height: 500px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
