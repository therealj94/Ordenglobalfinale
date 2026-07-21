const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoginToken = sequelize.define('LoginToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    refreshExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    issuedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    appName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return LoginToken;
};
