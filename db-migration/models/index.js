'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
let config = require(__dirname + '/../config/config.json')[env];
if (config === undefined) {
  config = {
      "username": "noteuser",
      "password": "notepassword",
      "database": "notedb",
      "host": "127.0.0.1",
      "port": 5432,
      "dialect": "postgres",
      "define": {
        "noPrimaryKey": true
      }
    };
  // console.log("DB Config 2:", config);
}

const models = {};

let sequelize;

function initializeSequelize(configInput = config) {
  if (configInput.use_env_variable) {
    sequelize = new Sequelize(process.env[configInput.use_env_variable], configInput);
  } else {
    sequelize = new Sequelize(configInput.database, configInput.username, configInput.password, configInput);
  }

  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    });

  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  models.sequelize = sequelize;
  models.Sequelize = Sequelize;
  // console.log('🔧 Database models initialized models:', models);
  // console.log('🔧 Database models initialized models.Sso:', models.Sso);
  // console.log('🔧 Database models initialized models.RegisterToken:', models.RegisterToken);
  return models;
}

module.exports = {models, initializeSequelize};
