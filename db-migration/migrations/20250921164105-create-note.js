'use strict';
const {Sequelize} = require('sequelize');
const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5433/notedb_test');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    if (process.env.ENVIRONMENT == 'test') {
      queryInterface = sequelize.getQueryInterface();
    }

    await queryInterface.createTable('notes', {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING
      },
      content: {
        type: Sequelize.STRING
      },
      isArchieved: {
        type: Sequelize.BOOLEAN
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
    if (process.env.ENVIRONMENT == 'test') {
      queryInterface = sequelize.getQueryInterface();
    }

    await queryInterface.dropTable('notes');
  }
};