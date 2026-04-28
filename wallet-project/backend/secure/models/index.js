const { Sequelize } = require('sequelize');

// Update 'password' with your actual MySQL root password if you have one.
const sequelize = new Sequelize('secure_wallet', 'root', 'root@1234', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // Set to console.log to see SQL queries during execution
});

// Initialize models
const User = require('./user')(sequelize);
const Wallet = require('./wallet')(sequelize);
const Transaction = require('./transaction')(sequelize);
const Session = require('./session')(sequelize);
const AuditLog = require('./audit_log')(sequelize);

// Define Relational Associations
User.hasMany(Wallet, { foreignKey: 'user_id' });
Wallet.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Session, { foreignKey: 'user_id' });
Session.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

Wallet.hasMany(Transaction, { foreignKey: 'sender_wallet_id', as: 'SentTransactions' });
Wallet.hasMany(Transaction, { foreignKey: 'receiver_wallet_id', as: 'ReceivedTransactions' });

module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  Session,
  AuditLog
};
