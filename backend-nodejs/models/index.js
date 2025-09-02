const { sequelize } = require('../config/database');
const Conversation = require('./Conversation');

// Initialize models
const models = {
  Conversation
};

// Define associations if needed
// Example: User.hasMany(Conversation);

// Export models and sequelize instance
module.exports = {
  sequelize,
  ...models
};
