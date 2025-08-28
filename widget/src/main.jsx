import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './widget.css';

// Create root element if it doesn't exist
let rootElement = document.getElementById('ai-support-widget-root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'ai-support-widget-root';
  document.body.appendChild(rootElement);
}

// Initialize React app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Export for programmatic control
window.AISupportWidget = {
  open: () => {
    window.postMessage({ type: 'WIDGET_OPEN' }, '*');
  },
  close: () => {
    window.postMessage({ type: 'WIDGET_CLOSE' }, '*');
  },
  configure: (config) => {
    window.postMessage({ type: 'WIDGET_CONFIG', config }, '*');
  }
};
