const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ManualReviewCase = sequelize.define('ManualReviewCase', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    verificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Verifications',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Manual review required'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'ManualReviewCases'
  });

  return ManualReviewCase;
};
