const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConnectedApp = sequelize.define('ConnectedApp', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    appName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    redirectUrls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'ConnectedApps'
  });

  return ConnectedApp;
};
