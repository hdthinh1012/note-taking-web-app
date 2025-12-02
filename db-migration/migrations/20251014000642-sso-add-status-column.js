'use strict';
const {Sequelize} = require('sequelize');
const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5433/notedb_test');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, DataTypes) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    if (process.env.ENVIRONMENT == 'test') {
      queryInterface = sequelize.getQueryInterface();
    }
    await queryInterface.addColumn('ssos', 'status', {
      type: Sequelize.STRING,
    });
  },

  async down (queryInterface, DataTypes) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    if (process.env.ENVIRONMENT == 'test') {
      queryInterface = sequelize.getQueryInterface();
    }
    await queryInterface.removeColumn('ssos', 'status');
  }
};
