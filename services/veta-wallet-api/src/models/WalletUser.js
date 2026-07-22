const { DataTypes } = require('sequelize');

// Veta Wallet does NOT store its own password — identity and verification
// live entirely in GENESIS ID. This row is created/updated the first time
// someone logs in (after GENESIS ID confirms who they are and that they're
// verified), keyed by their permanent GENESIS ID (gid).
module.exports = (sequelize) => {
  const WalletUser = sequelize.define('WalletUser', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    genesisUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    gid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    balance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'WalletUsers'
  });

  return WalletUser;
};
