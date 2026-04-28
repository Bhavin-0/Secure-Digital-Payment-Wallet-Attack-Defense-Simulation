const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      // Security: Obfuscates wallet count and IDOR
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Security: Foreign key linking the wallet strictly to its authenticated owner
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0 // Security: Enforces positive balance at application layer
      }
      // Security: Stored in cents/paise ONLY to prevent floating-point precision manipulation
    },
    status: {
      type: DataTypes.ENUM('active', 'frozen', 'closed'),
      defaultValue: 'active',
      // Security: Critical for incident response; allows freezing assets during suspected breaches
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      // Security: Implements Optimistic Concurrency Control to prevent race condition attacks (e.g., double spending)
    }
  }, {
    tableName: 'wallets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    version: true, // Security: Sequelize automatically increments this on save for concurrency control
    indexes: [
      {
        fields: ['user_id'] // Performance/Security: Indexed for fast retrieval of a user's wallets
      }
    ]
  });

  return Wallet;
};
