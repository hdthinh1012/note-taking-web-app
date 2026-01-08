'use strict';
const {Sequelize} = require('sequelize');
const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5433/notedb_test');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    if (process.env.ENVIRONMENT == 'test') {
      queryInterface = sequelize.getQueryInterface();
    }

    await queryInterface.createTable('register_tokens', {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sso_uuid: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'CREATED'
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

    await queryInterface.dropTable('register_tokens');
  }
};
