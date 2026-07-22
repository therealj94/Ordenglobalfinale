const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const WalletUser = require('./WalletUser')(sequelize);
const Transaction = require('./Transaction')(sequelize);

WalletUser.hasMany(Transaction, { foreignKey: 'fromWalletUserId', as: 'sentTransactions' });
WalletUser.hasMany(Transaction, { foreignKey: 'toWalletUserId', as: 'receivedTransactions' });
Transaction.belongsTo(WalletUser, { foreignKey: 'fromWalletUserId', as: 'sender' });
Transaction.belongsTo(WalletUser, { foreignKey: 'toWalletUserId', as: 'recipient' });

module.exports = { sequelize, Sequelize, WalletUser, Transaction };
