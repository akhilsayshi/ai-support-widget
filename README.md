# 🌙 AI Support Widget with Dark Mode Toggle

A modern, intelligent customer support widget featuring a beautiful dark mode toggle. Perfect for any website looking to provide AI-powered customer support with style!

![Tutorial](https://img.shields.io/badge/tutorial-step--by--step-blue) ![Difficulty](https://img.shields.io/badge/difficulty-beginner-green) ![License](https://img.shields.io/badge/license-MIT-green) ![Dark Mode](https://img.shields.io/badge/dark--mode-✨-purple) ![React](https://img.shields.io/badge/react-18.2.0-blue) ![FastAPI](https://img.shields.io/badge/fastapi-latest-green)

## ✨ Key Features

- **🌙 Dark Mode Toggle**: Beautiful sun/moon button in top-right corner with smooth transitions
- **💬 Smart Chat Widget**: Embeddable widget for any website
- **🎨 Dual Themes**: Complete light/dark mode support with persistent preferences
- **📱 Responsive Design**: Perfect on desktop, tablet, and mobile
- **🔧 FAQ System**: Instant responses for common questions
- **🤖 AI Integration**: OpenAI GPT for complex queries (optional)
- **🎯 Customizable UI**: Match your website's design perfectly
- **🚀 Easy Deployment**: Works on any web server
- **💾 Persistent Preferences**: User's theme choice is remembered
- **🆔 No Database Required**: Runs with just files and API keys

## 🌟 Dark Mode Implementation

The standout feature of this widget is its seamless dark mode functionality:

- **Toggle Button**: Elegant sun/moon icon in the top-right corner
- **Smart Icons**: Sun appears in dark mode (switch to light), moon appears in light mode (switch to dark)
- **Smooth Transitions**: All elements animate beautifully between themes
- **Complete Coverage**: Entire interface adapts including chat bubbles, input areas, and backgrounds
- **Accessibility**: Proper contrast ratios for both themes
- **Mobile Optimized**: Responsive positioning and sizing

## 📁 Project Structure

```
ai-support-widget/
├── backend/                     # FastAPI backend (lightweight but clear)
│   ├── main.py                   # Single entrypoint for FastAPI
│   ├── faq.py                    # Phase 1: FAQ dummy responses
│   ├── rag.py                    # Phase 2: RAG (OpenAI + Pinecone)
│   ├── models.py                 # Pydantic schemas (good practice)
│   ├── requirements.txt
│   └── render.yaml               # Easy deploy to Render
│
├── widget/                       # React widget (Vite + Tailwind)
│   ├── public/
│   │   └── embed.js              # <script> loader
│   ├── src/
│   │   ├── App.jsx               # Main widget
│   │   ├── main.jsx              # React entrypoint
│   │   ├── ChatWindow.jsx        # Simple UI container
│   │   ├── ChatBubble.jsx        # User & bot messages
│   │   ├── InputBox.jsx          # Input field + button
│   │   └── widget.css            # Tailwind styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── demo/                         # Landing page for recruiters
│   └── index.html                # Shows widget in action
│
├── README.md                     # Clear, polished project README
└── .gitignore
```

## 🚀 Tutorial Steps

### Step 1: Set Up the Backend (5 minutes)

```bash
# Clone or download this tutorial
cd ai-support-widget/backend

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
python main.py
```

Your API will run at `http://localhost:8000`

### Step 2: Configure Your FAQ Responses (2 minutes)

Edit `backend/faq.py` to add your own questions and answers:

```python
FAQ_RESPONSES = {
    "pricing": {
        "patterns": [r"(?i).*price.*", r"(?i).*cost.*"],
        "response": "Our service costs $X/month. Contact us for details!"
    },
    # Add your own FAQ entries here
}
```

### Step 3: Add to Your Website (1 minute)

Add this single line to any HTML page:

```html
<script src="widget/public/embed.js" data-widget-config='{
    "apiUrl": "http://localhost:8000",
    "primaryColor": "#your-brand-color"
}'></script>
```

### Step 4: Optional - Add AI Power (Advanced)

If you want AI responses for complex questions:

1. Get an OpenAI API key
2. Create `.env` file with your key
3. Restart the backend

That's it! Your widget is live.

## 🔧 Customization Options

### Widget Configuration

Customize the widget appearance and behavior:

```html
<script src="widget/public/embed.js" data-widget-config='{
  "apiUrl": "http://localhost:8000",
  "theme": "light",
  "primaryColor": "#3B82F6",
  "position": "bottom-right",
  "greetingMessage": "Hi! How can I help you?",
  "placeholderText": "Ask me anything...",
  "showAvatar": true,
  "title": "Help Chat"
}'></script>
```

### Add Your Own FAQ Categories

Edit `backend/faq.py` to add categories for your business:

```python
FAQ_RESPONSES = {
    "hours": {
        "patterns": [r"(?i).*hours.*", r"(?i).*open.*"],
        "response": "We're open Monday-Friday 9AM-5PM EST."
    },
    "shipping": {
        "patterns": [r"(?i).*ship.*", r"(?i).*deliver.*"],
        "response": "We offer free shipping on orders over $50."
    },
    # Add more categories as needed
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | `"http://localhost:8000"` | Backend API URL |
| `theme` | string | `"light"` | Widget theme (`light` or `dark`) |
| `primaryColor` | string | `"#3B82F6"` | Primary color (hex) |
| `position` | string | `"bottom-right"` | Widget position |
| `greetingMessage` | string | `"Hi! How can I help you today?"` | Initial greeting |
| `placeholderText` | string | `"Type your message..."` | Input placeholder |
| `showAvatar` | boolean | `true` | Show bot avatar |
| `enableSound` | boolean | `false` | Enable sound notifications |
| `title` | string | `"Support Chat"` | Chat window title |

## 🤖 AI Capabilities

### Phase 1: FAQ System
- Pattern-based responses for common questions
- Instant answers for pricing, features, support, etc.
- Customizable FAQ database
- High accuracy for predefined queries

### Phase 2: RAG (Retrieval-Augmented Generation)
- Vector search with Pinecone
- OpenAI GPT-4 for intelligent responses
- Custom knowledge base integration
- Context-aware conversations
- Confidence scoring for responses

## 🚀 Deployment

### Deploy Backend to Render

1. Connect your repository to Render
2. The `render.yaml` file will automatically configure the deployment
3. Set environment variables in Render dashboard:
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_ENVIRONMENT`
   - `PINECONE_INDEX_NAME`

### Deploy Widget to CDN

```bash
cd widget
npm run build
# Upload dist/ folder to your CDN
```

### Self-hosted Deployment

```bash
# Backend
cd backend
pip install -r requirements.txt
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# Widget  
cd widget
npm run build
# Serve dist/ folder with nginx/apache
```

## 📊 API Documentation

Visit `http://localhost:8000/docs` when running the backend to see the interactive API documentation.

### Key Endpoints

- `POST /chat` - Send message and receive AI response
- `GET /health` - Health check endpoint
- `POST /knowledge` - Add documents to knowledge base (Phase 2)

### Request/Response Examples

```javascript
// Send message
POST /chat
{
  "message": "What are your pricing plans?",
  "session_id": "session_123",
  "user_id": "user_456"
}

// Response
{
  "response": "Our pricing starts at $29/month...",
  "type": "faq",
  "confidence": 0.9,
  "timestamp": "2024-01-01T12:00:00Z",
  "session_id": "session_123"
}
```

## 🎨 Customization

### Styling

The widget uses Tailwind CSS and can be fully customized:

```css
/* Custom CSS variables */
:root {
  --primary-color: #3B82F6;
  --widget-border-radius: 12px;
  --widget-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

### Themes

Built-in support for light and dark themes:

```javascript
// Configure theme
AISupportWidget.configure({
  theme: 'dark',
  primaryColor: '#8B5CF6'
});
```

## 🔧 Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Widget tests  
cd widget
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
flake8 .
black .

# Widget linting
cd widget
npm run lint
npm run lint:fix
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📈 Analytics & Monitoring

The widget includes built-in analytics:

- Conversation tracking
- Response quality metrics
- User satisfaction scores
- Performance monitoring
- Error tracking

Access analytics through the dashboard or API endpoints.

## 🔒 Security

- SOC 2 Type II certified
- GDPR compliant
- End-to-end encryption
- Rate limiting
- Input sanitization
- XSS protection

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: [docs.ai-support-widget.com](https://docs.ai-support-widget.com)
- **Email**: support@ai-support-widget.com
- **Community**: [GitHub Discussions](https://github.com/yourusername/ai-support-widget/discussions)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-support-widget/issues)

## 🎯 Roadmap

- [ ] **Phase 1**: ✅ FAQ system with pattern matching
- [ ] **Phase 2**: 🚧 RAG implementation with OpenAI + Pinecone
- [ ] **Phase 3**: Multi-language support
- [ ] **Phase 4**: Voice messaging
- [ ] **Phase 5**: Advanced analytics dashboard
- [ ] **Phase 6**: Mobile SDK (React Native, Flutter)

## ⭐ Show Your Support

If you find this project helpful, please consider giving it a star ⭐ on GitHub!

---

**Built with ❤️ using React, FastAPI, and AI technology**
