const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true,
    comment: 'Unique session identifier'
  },
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    },
    comment: 'User message content'
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 2000]
    },
    comment: 'AI response content'
  },
  userIp: {
    type: DataTypes.INET,
    allowNull: false,
    comment: 'User IP address'
  },
  context: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional context (page, userAgent, etc.)'
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'gpt-3.5-turbo',
    comment: 'OpenAI model used'
  },
  tokens: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Token usage statistics'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'User rating (1-5)'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    },
    comment: 'User feedback text'
  }
}, {
  tableName: 'conversations',
  indexes: [
    {
      fields: ['sessionId', 'createdAt']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['userIp', 'createdAt']
    },
    {
      fields: ['rating']
    }
  ],
  comment: 'Stores conversation history between users and AI'
});

module.exports = Conversation;
