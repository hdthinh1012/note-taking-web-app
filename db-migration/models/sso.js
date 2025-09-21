'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sso extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      sso.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  sso.init({
    userId: DataTypes.UUID,
    type: DataTypes.STRING,
    sso_account: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'sso',
  });
  return sso;
};