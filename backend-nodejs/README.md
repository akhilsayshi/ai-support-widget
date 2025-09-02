# AI Support Widget - Node.js Backend

A robust Node.js backend service for the AI Support Widget, built with Express.js, PostgreSQL, and OpenAI integration.

## 🚀 Features

- **Express.js REST API** - Fast, unopinionated web framework
- **OpenAI Integration** - Intelligent AI responses using GPT models
- **PostgreSQL Database** - Reliable relational database with Sequelize ORM
- **Database Migrations** - Version-controlled database schema management
- **Rate Limiting** - Protection against abuse and spam
- **Comprehensive Logging** - Winston-based logging with file rotation
- **Error Handling** - Centralized error handling and validation
- **Health Checks** - Kubernetes-ready health and readiness probes
- **Security** - Helmet.js security headers and CORS protection
- **Environment Configuration** - Flexible environment-based configuration

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **AI Service**: OpenAI GPT API
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Testing**: Jest, Supertest

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 12+ (local or cloud instance)
- OpenAI API key

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   cd backend-nodejs
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ai_support_widget_dev` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `password` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### OpenAI Configuration

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

## 📚 API Endpoints

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with database status
- `GET /api/health/ready` - Readiness probe for Kubernetes

### Chat API
- `POST /api/chat/message` - Send message and get AI response
- `GET /api/chat/history/:sessionId` - Get conversation history
- `POST /api/chat/feedback` - Submit feedback for conversation

### Example Usage

```javascript
// Send a chat message
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'How do I reset my password?',
    sessionId: 'uuid-session-id',
    context: {
      page: '/dashboard',
      userAgent: 'Mozilla/5.0...'
    }
  })
});

const data = await response.json();
console.log(data.data.response); // AI response
```

## 🗄 Database Schema

### Conversation Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_ip INET NOT NULL,
  context JSONB,
  model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
  tokens JSONB,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_session_created ON conversations(session_id, created_at);
CREATE INDEX idx_conversations_created ON conversations(created_at);
CREATE INDEX idx_conversations_user_ip_created ON conversations(user_ip, created_at);
CREATE INDEX idx_conversations_rating ON conversations(rating);
```

### Database Migrations
```bash
# Run migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring & Logging

### Log Files
- `logs/error.log` - Error-level logs only
- `logs/all.log` - All log levels

### Health Monitoring
```bash
# Basic health check
curl http://localhost:3001/api/health

# Detailed health check
curl http://localhost:3001/api/health/detailed
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=ai_support_widget
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true
OPENAI_API_KEY=your-openai-key
FRONTEND_URL=https://your-frontend-domain.com
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin restrictions
- **Security Headers**: Helmet.js security middleware
- **Input Validation**: Express-validator for request validation
- **Error Handling**: No sensitive data exposure in production

## 📈 Performance Features

- **Connection Pooling**: PostgreSQL connection pooling with Sequelize
- **Compression**: Gzip compression for responses
- **Caching**: Ready for Redis integration
- **Database Indexing**: Optimized queries with proper PostgreSQL indexes
- **JSONB Support**: Efficient JSON storage and querying
- **Database Migrations**: Version-controlled schema changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the health check endpoints
