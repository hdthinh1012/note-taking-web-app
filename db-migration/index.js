const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres://noteuser:notepassword@localhost:5432/notedb');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = { sequelize, Sequelize };