const { Conversation } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Save a conversation to the database
 * @param {Object} conversationData - The conversation data to save
 * @returns {Promise<Object>} Saved conversation document
 */
async function saveConversation(conversationData) {
  try {
    const conversation = await Conversation.create({
      sessionId: conversationData.sessionId,
      userMessage: conversationData.userMessage,
      aiResponse: conversationData.aiResponse,
      userIp: conversationData.userIP,
      context: conversationData.context,
      model: conversationData.model,
      tokens: conversationData.tokens
    });
    
    logger.info(`Conversation saved for session: ${conversationData.sessionId}`);
    return conversation;
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
    const conversations = await Conversation.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']],
      limit,
      attributes: ['userMessage', 'aiResponse', 'createdAt', 'model', 'tokens']
    });

    logger.info(`Retrieved ${conversations.length} messages for session: ${sessionId}`);
    return conversations.map(conv => ({
      userMessage: conv.userMessage,
      aiResponse: conv.aiResponse,
      timestamp: conv.createdAt,
      model: conv.model,
      tokens: conv.tokens
    }));
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
    const stats = await Conversation.findOne({
      where: { sessionId },
      attributes: [
        [Conversation.sequelize.fn('COUNT', Conversation.sequelize.col('id')), 'totalMessages'],
        [Conversation.sequelize.fn('SUM', Conversation.sequelize.literal("(tokens->>'total_tokens')::int")), 'totalTokens'],
        [Conversation.sequelize.fn('AVG', Conversation.sequelize.col('rating')), 'avgRating'],
        [Conversation.sequelize.fn('MIN', Conversation.sequelize.col('createdAt')), 'firstMessage'],
        [Conversation.sequelize.fn('MAX', Conversation.sequelize.col('createdAt')), 'lastMessage']
      ],
      raw: true
    });

    return {
      totalMessages: parseInt(stats.totalMessages) || 0,
      totalTokens: parseInt(stats.totalTokens) || 0,
      avgRating: parseFloat(stats.avgRating) || null,
      firstMessage: stats.firstMessage,
      lastMessage: stats.lastMessage
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
    const whereClause = {};
    
    // Add date range filter
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) whereClause.createdAt[Op.lte] = new Date(filters.endDate);
    }

    // Add user IP filter
    if (filters.userIP) {
      whereClause.userIp = filters.userIP;
    }

    const analytics = await Conversation.findOne({
      where: whereClause,
      attributes: [
        [Conversation.sequelize.fn('COUNT', Conversation.sequelize.col('id')), 'totalConversations'],
        [Conversation.sequelize.fn('COUNT', Conversation.sequelize.fn('DISTINCT', Conversation.sequelize.col('sessionId'))), 'uniqueSessions'],
        [Conversation.sequelize.fn('SUM', Conversation.sequelize.literal("(tokens->>'total_tokens')::int")), 'totalTokens'],
        [Conversation.sequelize.fn('AVG', Conversation.sequelize.col('rating')), 'avgRating'],
        [Conversation.sequelize.fn('AVG', Conversation.sequelize.literal("(tokens->>'total_tokens')::int")), 'avgTokensPerMessage']
      ],
      raw: true
    });

    return {
      totalConversations: parseInt(analytics.totalConversations) || 0,
      uniqueSessions: parseInt(analytics.uniqueSessions) || 0,
      totalTokens: parseInt(analytics.totalTokens) || 0,
      avgRating: parseFloat(analytics.avgRating) || null,
      avgTokensPerMessage: parseFloat(analytics.avgTokensPerMessage) || 0
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

    const [updatedCount] = await Conversation.update(updateData, {
      where: { sessionId },
      order: [['createdAt', 'DESC']],
      limit: 1
    });

    if (updatedCount === 0) {
      throw new Error('Conversation not found');
    }

    const updatedConversation = await Conversation.findOne({
      where: { sessionId },
      order: [['createdAt', 'DESC']]
    });

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

    const deletedCount = await Conversation.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deletedCount} conversations older than ${daysOld} days`);
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old conversations:', error);
    throw error;
  }
}

/**
 * Get recent conversations for monitoring
 * @param {number} limit - Number of recent conversations to return
 * @returns {Promise<Array>} Recent conversations
 */
async function getRecentConversations(limit = 10) {
  try {
    const conversations = await Conversation.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      attributes: ['id', 'sessionId', 'userMessage', 'aiResponse', 'createdAt', 'userIp', 'rating']
    });

    return conversations;
  } catch (error) {
    logger.error('Error getting recent conversations:', error);
    throw error;
  }
}

/**
 * Get conversation by ID
 * @param {string} id - Conversation ID
 * @returns {Promise<Object>} Conversation
 */
async function getConversationById(id) {
  try {
    const conversation = await Conversation.findByPk(id);
    return conversation;
  } catch (error) {
    logger.error('Error getting conversation by ID:', error);
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
  getRecentConversations,
  getConversationById,
  Conversation
};