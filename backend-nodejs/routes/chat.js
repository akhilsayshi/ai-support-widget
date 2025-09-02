const express = require('express');
const { body, validationResult } = require('express-validator');
const { generateResponse } = require('../services/openaiService');
const { saveConversation, getConversationHistory } = require('../services/conversationService');
const { logger } = require('../utils/logger');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for chat endpoints
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 chat requests per minute
  message: {
    error: 'Too many chat requests, please slow down.',
  },
});

// Validation middleware
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('sessionId')
    .optional()
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
];

// POST /api/chat/message - Send a message and get AI response
router.post('/message', chatLimiter, validateChatMessage, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, sessionId, context = {} } = req.body;
    const userIP = req.ip || req.connection.remoteAddress;

    logger.info(`Chat request from IP: ${userIP}, Session: ${sessionId || 'new'}`);

    // Get conversation history if sessionId provided
    let conversationHistory = [];
    if (sessionId) {
      conversationHistory = await getConversationHistory(sessionId);
    }

    // Generate AI response
    const aiResponse = await generateResponse(message, conversationHistory, context);

    // Save conversation to database
    const conversationData = {
      sessionId: sessionId || generateSessionId(),
      userMessage: message,
      aiResponse: aiResponse.text,
      timestamp: new Date(),
      userIP,
      context,
      model: aiResponse.model,
      tokens: aiResponse.usage
    };

    await saveConversation(conversationData);

    // Return response
    res.json({
      success: true,
      data: {
        response: aiResponse.text,
        sessionId: conversationData.sessionId,
        timestamp: conversationData.timestamp,
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });

  } catch (error) {
    logger.error('Chat endpoint error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'AI service quota exceeded. Please try again later.'
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to AI service. Please slow down.'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process chat message. Please try again.'
    });
  }
});

// GET /api/chat/history/:sessionId - Get conversation history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || !isValidUUID(sessionId)) {
      return res.status(400).json({
        error: 'Invalid session ID',
        message: 'Session ID must be a valid UUID'
      });
    }

    const history = await getConversationHistory(sessionId);
    
    res.json({
      success: true,
      data: {
        sessionId,
        messages: history,
        count: history.length
      }
    });

  } catch (error) {
    logger.error('History endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve conversation history'
    });
  }
});

// POST /api/chat/feedback - Submit feedback for a conversation
router.post('/feedback', [
  body('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString().isLength({ max: 500 }).withMessage('Feedback must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sessionId, rating, feedback } = req.body;
    
    // Here you would typically save feedback to database
    logger.info(`Feedback received - Session: ${sessionId}, Rating: ${rating}, Feedback: ${feedback || 'None'}`);
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    logger.error('Feedback endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit feedback'
    });
  }
});

// Utility functions
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

module.exports = router;
