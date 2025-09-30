'use strict';
const {Sequelize} = require('sequelize');
const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5433/notedb_test');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('ssos', {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID
      },
      type: {
        type: Sequelize.STRING
      },
      sso_account: {
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
    await queryInterface.dropTable('ssos');
  }
};