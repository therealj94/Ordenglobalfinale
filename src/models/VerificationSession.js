const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VerificationSession = sequelize.define('VerificationSession', {
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
    veriffUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    externalDossierRef: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('created', 'started', 'submitted', 'decided', 'abandoned'),
      defaultValue: 'created'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return VerificationSession;
};
