import dbMigration from '@ntwa/db-migration/index.js';
import dbModels from '@ntwa/db-migration/models/index.js';

const { sequelize, Sequelize } = dbMigration;
const { initializeSequelize, models } = dbModels;

/**
 * Database configuration for the Express server
 * Imports Sequelize instance and models from db-migration package
 */

class DatabaseManager {
  constructor(sequelizeInstance, modelsInstance) {
    this.sequelize = sequelizeInstance || sequelize;
    this.Sequelize = Sequelize;
    this.models = modelsInstance || initializeSequelize();
    console.log('🔧 Initializing database models...', this.models);

    this.isConnected = false;
  }

  /**
   * Initialize database connection
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connection established successfully.');
      this.isConnected = true;
      
      // Sync models if needed (be careful in production)
      if (process.env.NODE_ENV === 'development') {
        await this.sequelize.sync({ alter: false });
        console.log('✅ Database models synchronized.');
      }
    } catch (error) {
      console.error('❌ Unable to connect to the database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      await this.sequelize.close();
      console.log('✅ Database connection closed successfully.');
      this.isConnected = false;
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   * @returns {boolean}
   */
  isHealthy() {
    return this.isConnected;
  }

  /**
   * Get specific model by name
   * @param {string} modelName - Name of the model (e.g., 'User', 'Note', 'Category', 'Sso')
   * @returns {Object} Sequelize model
   */
  getModel(modelName) {
    if (!this.models[modelName]) {
      throw new Error(`Model '${modelName}' not found. Available models: ${Object.keys(this.models).join(', ')}`);
    }
    return this.models[modelName];
  }

  /**
   * Get all available models
   * @returns {Object} All models
   */
  getAllModels() {
    return this.models;
  }

  /**
   * Execute raw SQL query
   * @param {string} query - SQL query string
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async executeQuery(query, options = {}) {
    try {
      const [results, metadata] = await this.sequelize.query(query, {
        type: this.Sequelize.QueryTypes.SELECT,
        ...options
      });
      return results;
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  /**
   * Start a database transaction
   * @returns {Promise<Transaction>}
   */
  async startTransaction() {
    return await this.sequelize.transaction();
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Database manager instance
const db = databaseManager;

// Convenient model exports (destructured for easy access)
const User = models.user;
const Note = models.note;
const Category = models.category;
const Sso = models.sso;
const RegisterToken = models.register_token;

// Helper functions
const connect = () => databaseManager.connect();
const disconnect = () => databaseManager.disconnect();
const isHealthy = () => databaseManager.isHealthy();
const testConnection = () => databaseManager.testConnection();

// Transaction helper
const transaction = async (callback) => {
  const t = await databaseManager.startTransaction();
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// Export both the manager and direct access to common properties
export {
  db,
  DatabaseManager,
  sequelize,
  Sequelize,
  models,
  User,
  Note,
  Category,
  Sso,
  RegisterToken,
  connect,
  disconnect,
  isHealthy,
  testConnection,
  transaction
};