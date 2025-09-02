# AI Support Widget

A modern, full-stack customer support widget with intelligent AI responses, built with React frontend and Node.js backend.

## 🚀 Features

### Frontend (React + Vite)
- **Dark Mode Toggle**: Complete light/dark theme support with persistent preferences
- **Smart Chat Widget**: Embeddable widget for any website
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Easy Integration**: Single script tag deployment
- **Modern UI**: Sleek, professional design inspired by Stripe/Vercel

### Backend (Node.js + Express)
- **REST API**: Comprehensive REST API with Express.js
- **AI Integration**: OpenAI GPT integration for intelligent responses
- **Database**: MongoDB with Mongoose ODM for conversation storage
- **Security**: Rate limiting, CORS protection, input validation
- **Logging**: Winston-based logging with file rotation
- **Health Checks**: Kubernetes-ready health and readiness probes
- **Docker Support**: Complete Docker containerization

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript ES6+** - Modern JavaScript features

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **OpenAI API** - AI language model integration
- **Winston** - Logging library
- **Docker** - Containerization

## 🚀 Quick Start

### Option 1: Node.js Backend (Recommended)

1. **Start the Backend**:
   ```bash
   cd backend-nodejs
   npm install
   cp env.example .env
   # Edit .env with your API keys
   npm run dev
   ```

2. **Start the Frontend**:
   ```bash
   cd widget
   npm install
   npm run dev
   ```

### Option 2: Python Backend (Legacy)

1. **Automated Setup** (Recommended):
   ```bash
   python setup.py
   ```

2. **Manual Setup**:
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your actual API keys
   # OPENAI_API_KEY=your-openai-api-key-here
   # PINECONE_API_KEY=your-pinecone-api-key-here
   ```

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:8000`


### 2. Frontend Setup

```bash
cd widget
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 3. Add to Your Website

```html
<script src="widget/public/embed.js" data-widget-config='{
    "apiUrl": "http://localhost:8000",
    "primaryColor": "#3B82F6"
}'></script>
```

## Project Structure

```
ai-support-widget/
├── backend/              # FastAPI backend
│   ├── main.py          # API server
│   ├── faq.py           # FAQ responses
│   ├── models.py        # Data models
│   └── requirements.txt
├── widget/              # React frontend
│   ├── src/
│   │   ├── App.jsx      # Main widget
│   │   ├── ChatWindow.jsx
│   │   └── ChatBubble.jsx
│   └── package.json
└── test-widget.html     # Demo page
```

## Configuration

Customize the widget by editing the config object:

```javascript
{
  "apiUrl": "http://localhost:8000",
  "theme": "light",           // "light" or "dark"
  "primaryColor": "#3B82F6",  // Hex color
  "position": "bottom-right", // Widget position
  "greetingMessage": "Hi! How can I help you?",
  "placeholderText": "Type your message...",
  "title": "Support Chat"
}
```

## Adding FAQ Responses

Edit `backend/faq.py` to add your own responses:

```python
FAQ_RESPONSES = {
    "pricing": {
        "patterns": [r"(?i).*price.*", r"(?i).*cost.*"],
        "response": "Our service costs $X/month. Contact us for details!"
    },
    "hours": {
        "patterns": [r"(?i).*hours.*", r"(?i).*open.*"],
        "response": "We're open Monday-Friday 9AM-5PM EST."
    }
}
```

## AI Integration (Optional)

To enable AI responses for complex queries:

1. Get an OpenAI API key
2. Create `.env` file:
   ```
   OPENAI_API_KEY=your_key_here
   ```
3. Restart the backend

## API Endpoints

- `POST /chat` - Send message, receive response
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

## Deployment

### Backend (Render/Railway/Heroku)
```bash
cd backend
pip install -r requirements.txt
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend (Netlify/Vercel)
```bash
cd widget
npm run build
# Deploy dist/ folder
```

## Development

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd widget && npm test

# Linting
cd backend && flake8 .
cd widget && npm run lint
```

