'use strict';
const {Sequelize} = require('sequelize');
const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5433/notedb_test');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, DataTypes) {
    queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('categories');
  }
};