(function() {
    'use strict';
    
    // Default configuration
    const defaultConfig = {
        apiUrl: 'https://your-backend-api.com',
        theme: 'light',
        primaryColor: '#007bff',
        position: 'bottom-right',
        greetingMessage: 'Hi! How can I help you today?',
        placeholderText: 'Ask me anything...',
        showAvatar: true,
        title: 'AI Support',
        width: '350px',
        height: '500px'
    };

    // Get configuration from script tag
    function getConfig() {
        const script = document.currentScript || document.querySelector('script[data-widget-config]');
        if (script && script.dataset.widgetConfig) {
            try {
                return { ...defaultConfig, ...JSON.parse(script.dataset.widgetConfig) };
            } catch (e) {
                console.warn('Invalid widget configuration, using defaults:', e);
            }
        }
        return defaultConfig;
    }

    // Create widget container
    function createWidget(config) {
        const container = document.createElement('div');
        container.id = 'ai-support-widget';
        container.innerHTML = `
            <div id="widget-bubble" style="
                position: fixed;
                ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                width: 60px;
                height: 60px;
                background: ${config.primaryColor};
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                transition: all 0.3s ease;
            ">
                <span style="color: white; font-size: 24px;">💬</span>
            </div>
            <div id="widget-window" style="
                position: fixed;
                ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
                width: ${config.width};
                height: ${config.height};
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                display: none;
                z-index: 9998;
                flex-direction: column;
                overflow: hidden;
            ">
                <div style="
                    background: ${config.primaryColor};
                    color: white;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="font-weight: 600;">${config.title}</span>
                    <button id="widget-close" style="
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 18px;
                        padding: 0;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                <div id="widget-messages" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f8f9fa;
                ">
                    <div style="
                        background: white;
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 12px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    ">
                        ${config.greetingMessage}
                    </div>
                </div>
                <div style="
                    padding: 16px;
                    border-top: 1px solid #e9ecef;
                    background: white;
                ">
                    <div style="display: flex; gap: 8px;">
                        <input 
                            id="widget-input" 
                            type="text" 
                            placeholder="${config.placeholderText}"
                            style="
                                flex: 1;
                                padding: 10px;
                                border: 1px solid #ddd;
                                border-radius: 6px;
                                outline: none;
                                font-size: 14px;
                            "
                        />
                        <button id="widget-send" style="
                            background: ${config.primaryColor};
                            color: white;
                            border: none;
                            padding: 10px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Send</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        return container;
    }

    // Add message to chat
    function addMessage(content, isUser = false, config) {
        const messagesContainer = document.getElementById('widget-messages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            background: ${isUser ? config.primaryColor : 'white'};
            color: ${isUser ? 'white' : '#333'};
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            max-width: 80%;
            ${isUser ? 'margin-left: auto;' : ''}
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            word-wrap: break-word;
        `;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Send message to API
    async function sendMessage(message, config) {
        try {
            const response = await fetch(`${config.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: 'widget_' + Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response || data.message || 'Sorry, I could not process your request.';
        } catch (error) {
            console.error('Error sending message:', error);
            return 'Sorry, I\'m having trouble connecting right now. Please try again later.';
        }
    }

    // Initialize widget
    function initWidget() {
        const config = getConfig();
        const widget = createWidget(config);
        
        const bubble = document.getElementById('widget-bubble');
        const window = document.getElementById('widget-window');
        const closeBtn = document.getElementById('widget-close');
        const input = document.getElementById('widget-input');
        const sendBtn = document.getElementById('widget-send');

        // Toggle widget
        bubble.addEventListener('click', () => {
            const isVisible = window.style.display === 'flex';
            window.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                input.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            window.style.display = 'none';
        });

        // Send message
        async function handleSend() {
            const message = input.value.trim();
            if (!message) return;

            input.value = '';
            addMessage(message, true, config);
            
            // Show typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.style.cssText = `
                background: white;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                font-style: italic;
                color: #666;
            `;
            typingDiv.textContent = 'AI is typing...';
            document.getElementById('widget-messages').appendChild(typingDiv);

            const response = await sendMessage(message, config);
            
            // Remove typing indicator
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
            
            addMessage(response, false, config);
        }

        sendBtn.addEventListener('click', handleSend);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });

        // Global widget API
        window.AISupportWidget = {
            open: () => window.style.display = 'flex',
            close: () => window.style.display = 'none',
            sendMessage: (msg) => {
                input.value = msg;
                handleSend();
            }
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
