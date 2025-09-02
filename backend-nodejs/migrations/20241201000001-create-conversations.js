'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Unique session identifier'
      },
      user_message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'User message content'
      },
      ai_response: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'AI response content'
      },
      user_ip: {
        type: Sequelize.INET,
        allowNull: false,
        comment: 'User IP address'
      },
      context: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional context (page, userAgent, etc.)'
      },
      model: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'gpt-3.5-turbo',
        comment: 'OpenAI model used'
      },
      tokens: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Token usage statistics'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User rating (1-5)'
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User feedback text'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('conversations', ['session_id', 'created_at']);
    await queryInterface.addIndex('conversations', ['created_at']);
    await queryInterface.addIndex('conversations', ['user_ip', 'created_at']);
    await queryInterface.addIndex('conversations', ['rating']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
};
