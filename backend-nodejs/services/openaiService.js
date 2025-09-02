const OpenAI = require('openai');
const { logger } = require('../utils/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the AI support widget
const SYSTEM_PROMPT = `You are an intelligent customer support assistant for a modern web application. Your role is to:

1. Provide helpful, accurate, and friendly responses to user inquiries
2. Assist with technical questions about the application
3. Guide users through common tasks and troubleshooting
4. Escalate complex issues when appropriate
5. Maintain a professional yet approachable tone

Guidelines:
- Be concise but thorough in your responses
- Ask clarifying questions when needed
- Provide step-by-step instructions for complex tasks
- Acknowledge when you don't know something
- Always be helpful and solution-oriented

Context: This is an AI Support Widget that can be embedded in any website to provide instant customer support.`;

/**
 * Generate AI response using OpenAI API
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {Object} context - Additional context (user info, page, etc.)
 * @returns {Promise<Object>} AI response with text, model, and usage info
 */
async function generateResponse(userMessage, conversationHistory = [], context = {}) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add conversation history (limit to last 10 messages to manage token usage)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      messages.push(
        { role: 'user', content: msg.userMessage },
        { role: 'assistant', content: msg.aiResponse }
      );
    });

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // Add context if available
    if (context.page) {
      messages.push({
        role: 'system',
        content: `User is currently on page: ${context.page}`
      });
    }

    if (context.userAgent) {
      messages.push({
        role: 'system',
        content: `User's browser: ${context.userAgent}`
      });
    }

    logger.info(`Generating response for message: "${userMessage.substring(0, 50)}..."`);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const response = completion.choices[0].message.content;
    const usage = completion.usage;

    logger.info(`OpenAI response generated. Tokens used: ${usage.total_tokens}`);

    return {
      text: response,
      model: completion.model,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      }
    };

  } catch (error) {
    logger.error('OpenAI API error:', error);

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded');
    }

    if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI API rate limit exceeded');
    }

    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key');
    }

    // Fallback response for other errors
    return {
      text: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or contact our support team directly.",
      model: 'fallback',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
}

/**
 * Generate a quick response for common queries
 * @param {string} userMessage - The user's message
 * @returns {string} Quick response
 */
function generateQuickResponse(userMessage) {
  const message = userMessage.toLowerCase();

  // Common greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! I'm here to help you with any questions or issues you might have. How can I assist you today?";
  }

  // Common questions
  if (message.includes('help') || message.includes('support')) {
    return "I'm here to help! You can ask me about our features, troubleshooting, account issues, or anything else. What would you like to know?";
  }

  if (message.includes('pricing') || message.includes('cost') || message.includes('price')) {
    return "For information about our pricing plans and features, I'd recommend checking our pricing page. Would you like me to help you understand any specific plan or feature?";
  }

  if (message.includes('contact') || message.includes('email') || message.includes('phone')) {
    return "You can reach our support team at support@example.com or through our contact form. I'm also here to help with immediate questions!";
  }

  // Default response
  return "Thanks for your message! I'm processing your request and will provide a detailed response shortly.";
}

module.exports = {
  generateResponse,
  generateQuickResponse
};
