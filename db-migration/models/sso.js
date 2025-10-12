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
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    userId: DataTypes.UUID,
    type: DataTypes.STRING,
    sso_account: DataTypes.STRING,
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    sequelize,
    modelName: 'sso',
    noPrimaryKey: true
  });
  return sso;
};