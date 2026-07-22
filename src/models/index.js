const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const User = require('./User')(sequelize);
const Verification = require('./Verification')(sequelize);
const VerificationSession = require('./VerificationSession')(sequelize);
const LoginToken = require('./LoginToken')(sequelize);
const AppRegistration = require('./AppRegistration')(sequelize);
const AdminLog = require('./AdminLog')(sequelize);
const ManualReviewCase = require('./ManualReviewCase')(sequelize);
const ConnectedApp = require('./ConnectedApp')(sequelize);

// Associations
User.hasMany(Verification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Verification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(VerificationSession, { foreignKey: 'userId', onDelete: 'CASCADE' });
VerificationSession.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(LoginToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
LoginToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AppRegistration, { foreignKey: 'userId', onDelete: 'CASCADE' });
AppRegistration.belongsTo(User, { foreignKey: 'userId' });

Verification.hasOne(ManualReviewCase, { foreignKey: 'verificationId', onDelete: 'CASCADE' });
ManualReviewCase.belongsTo(Verification, { foreignKey: 'verificationId', as: 'verification' });

User.hasMany(ManualReviewCase, { foreignKey: 'userId', onDelete: 'CASCADE' });
ManualReviewCase.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Verification,
  VerificationSession,
  LoginToken,
  AppRegistration,
  AdminLog,
  ManualReviewCase,
  ConnectedApp
};
