const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AppRegistration = sequelize.define('AppRegistration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    appName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    linkedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  }, {
    timestamps: true
  });

  return AppRegistration;
};
