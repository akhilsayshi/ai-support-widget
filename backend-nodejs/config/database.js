const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

// Database configuration
const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ai_support_widget_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ai_support_widget_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

/**
 * Connect to PostgreSQL database
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connected to PostgreSQL successfully');

    // Sync database in development
    if (env === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('📊 Database synchronized');
    }

    // Handle connection events
    sequelize.connectionManager.on('connect', () => {
      logger.info('PostgreSQL connection established');
    });

    sequelize.connectionManager.on('disconnect', () => {
      logger.warn('PostgreSQL disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await sequelize.close();
      logger.info('PostgreSQL connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

/**
 * Disconnect from PostgreSQL
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  try {
    await sequelize.close();
    logger.info('PostgreSQL connection closed');
  } catch (error) {
    logger.error('Error closing PostgreSQL connection:', error);
    throw error;
  }
}

/**
 * Get database connection status
 * @returns {Object} Connection status information
 */
async function getConnectionStatus() {
  try {
    await sequelize.authenticate();
    return {
      status: 'connected',
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      dialect: dbConfig.dialect
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message
    };
  }
}

/**
 * Test database connection
 * @returns {Promise<Object>} Test result
 */
async function testConnection() {
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      responseTime: `${responseTime}ms`,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Database connection failed'
    };
  }
}

module.exports = {
  sequelize,
  connectDB,
  disconnectDB,
  getConnectionStatus,
  testConnection,
  config
};