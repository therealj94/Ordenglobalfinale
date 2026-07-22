const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Nullable: system-issued credits (e.g. welcome bonus) have no sender.
    fromWalletUserId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    fromGid: {
      type: DataTypes.STRING,
      allowNull: true
    },
    toWalletUserId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    toGid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('transfer', 'welcome_bonus'),
      allowNull: false,
      defaultValue: 'transfer'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('completed', 'failed'),
      allowNull: false,
      defaultValue: 'completed'
    }
  }, {
    timestamps: true,
    tableName: 'Transactions'
  });

  return Transaction;
};
