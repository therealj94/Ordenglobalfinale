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
    // The identifier this particular app knows the user by (Veta Wallet's
    // wallet address, My Token Pay's merchant id, …). Supplied by the app
    // itself — GENESIS ID stores it so a GID can be resolved to that app's
    // own account, but never generates or validates it.
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  }, {
    timestamps: true,
    tableName: 'AppRegistrations'
  });

  return AppRegistration;
};
