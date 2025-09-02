const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// Conversation schema
const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userMessage: {
    type: String,
    required: true,
    maxlength: 1000
  },
  aiResponse: {
    type: String,
    required: true,
    maxlength: 2000
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userIP: {
    type: String,
    required: true
  },
  context: {
    page: String,
    userAgent: String,
    referrer: String,
    customData: mongoose.Schema.Types.Mixed
  },
  model: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  tokens: {
    prompt_tokens: Number,
    completion_tokens: Number,
    total_tokens: Number
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Create indexes for better performance
conversationSchema.index({ sessionId: 1, timestamp: -1 });
conversationSchema.index({ timestamp: -1 });
conversationSchema.index({ userIP: 1, timestamp: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

/**
 * Save a conversation to the database
 * @param {Object} conversationData - The conversation data to save
 * @returns {Promise<Object>} Saved conversation document
 */
async function saveConversation(conversationData) {
  try {
    const conversation = new Conversation(conversationData);
    const savedConversation = await conversation.save();
    
    logger.info(`Conversation saved for session: ${conversationData.sessionId}`);
    return savedConversation;
  } catch (error) {
    logger.error('Error saving conversation:', error);
    throw error;
  }
}

/**
 * Get conversation history for a session
 * @param {string} sessionId - The session ID
 * @param {number} limit - Maximum number of messages to return (default: 50)
 * @returns {Promise<Array>} Array of conversation messages
 */
async function getConversationHistory(sessionId, limit = 50) {
  try {
    const conversations = await Conversation
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .select('userMessage aiResponse timestamp model tokens')
      .lean();

    logger.info(`Retrieved ${conversations.length} messages for session: ${sessionId}`);
    return conversations;
  } catch (error) {
    logger.error('Error retrieving conversation history:', error);
    throw error;
  }
}

/**
 * Get conversation statistics
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Conversation statistics
 */
async function getConversationStats(sessionId) {
  try {
    const stats = await Conversation.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          totalTokens: { $sum: '$tokens.total_tokens' },
          avgRating: { $avg: '$rating' },
          firstMessage: { $min: '$timestamp' },
          lastMessage: { $max: '$timestamp' }
        }
      }
    ]);

    return stats[0] || {
      totalMessages: 0,
      totalTokens: 0,
      avgRating: null,
      firstMessage: null,
      lastMessage: null
    };
  } catch (error) {
    logger.error('Error getting conversation stats:', error);
    throw error;
  }
}

/**
 * Get analytics data for admin dashboard
 * @param {Object} filters - Filter options (dateRange, userIP, etc.)
 * @returns {Promise<Object>} Analytics data
 */
async function getAnalytics(filters = {}) {
  try {
    const matchStage = {};
    
    // Add date range filter
    if (filters.startDate || filters.endDate) {
      matchStage.timestamp = {};
      if (filters.startDate) matchStage.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) matchStage.timestamp.$lte = new Date(filters.endDate);
    }

    // Add user IP filter
    if (filters.userIP) {
      matchStage.userIP = filters.userIP;
    }

    const analytics = await Conversation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' },
          totalTokens: { $sum: '$tokens.total_tokens' },
          avgRating: { $avg: '$rating' },
          avgTokensPerMessage: { $avg: '$tokens.total_tokens' }
        }
      },
      {
        $project: {
          totalConversations: 1,
          uniqueSessions: { $size: '$uniqueSessions' },
          totalTokens: 1,
          avgRating: { $round: ['$avgRating', 2] },
          avgTokensPerMessage: { $round: ['$avgTokensPerMessage', 2] }
        }
      }
    ]);

    return analytics[0] || {
      totalConversations: 0,
      uniqueSessions: 0,
      totalTokens: 0,
      avgRating: null,
      avgTokensPerMessage: 0
    };
  } catch (error) {
    logger.error('Error getting analytics:', error);
    throw error;
  }
}

/**
 * Update conversation with feedback
 * @param {string} sessionId - The session ID
 * @param {number} rating - Rating from 1-5
 * @param {string} feedback - Optional feedback text
 * @returns {Promise<Object>} Updated conversation
 */
async function updateConversationFeedback(sessionId, rating, feedback = null) {
  try {
    const updateData = { rating };
    if (feedback) updateData.feedback = feedback;

    const updatedConversation = await Conversation.findOneAndUpdate(
      { sessionId },
      updateData,
      { new: true, sort: { timestamp: -1 } }
    );

    if (!updatedConversation) {
      throw new Error('Conversation not found');
    }

    logger.info(`Feedback updated for session: ${sessionId}, rating: ${rating}`);
    return updatedConversation;
  } catch (error) {
    logger.error('Error updating conversation feedback:', error);
    throw error;
  }
}

/**
 * Clean up old conversations (for maintenance)
 * @param {number} daysOld - Delete conversations older than this many days
 * @returns {Promise<number>} Number of conversations deleted
 */
async function cleanupOldConversations(daysOld = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Conversation.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    logger.info(`Cleaned up ${result.deletedCount} conversations older than ${daysOld} days`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old conversations:', error);
    throw error;
  }
}

module.exports = {
  saveConversation,
  getConversationHistory,
  getConversationStats,
  getAnalytics,
  updateConversationFeedback,
  cleanupOldConversations,
  Conversation
};
