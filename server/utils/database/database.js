const models = require('db-migration/models');

console.log('Loaded models:', Object.keys(models));
const {sequelize, Sequelize} = require('db-migration');

/**
 * Database configuration for the Express server
 * Imports Sequelize instance and models from db-migration package
 */

class DatabaseManager {
  constructor() {
    this.sequelize = sequelize;
    this.Sequelize = Sequelize;
    this.models = models;
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

// Export both the manager and direct access to common properties
module.exports = {
  // Database manager instance
  db: databaseManager,
  
  // Direct access to Sequelize instance and models (for backward compatibility)
  sequelize,
  Sequelize,
  models,
  
  // Convenient model exports (destructured for easy access)
  User: models.User,
  Note: models.Note,
  Category: models.category,
  Sso: models.sso,
  
  // Helper functions
  connect: () => databaseManager.connect(),
  disconnect: () => databaseManager.disconnect(),
  isHealthy: () => databaseManager.isHealthy(),
  testConnection: () => databaseManager.testConnection(),
  
  // Transaction helper
  transaction: async (callback) => {
    const t = await databaseManager.startTransaction();
    try {
      const result = await callback(t);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
};