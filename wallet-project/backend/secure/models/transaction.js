const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      // Security: UUID to prevent exposing transaction velocity and IDOR
    },
    sender_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Security: Tracks the exact source of funds
    },
    receiver_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Security: Tracks the exact destination of funds
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1 // Security: Prevent 0 or negative amounts to mitigate logic flaws
      }
      // Security: Integer value strictly for cents/paise representation
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'reversed'),
      defaultValue: 'pending',
      // Security: Represents the strict state machine of a financial transaction
    },
    idempotency_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // Security: Protects against duplicate transactions and replay attacks
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['sender_wallet_id'] }, // Performance/Security: Fast lookup for sender queries
      { fields: ['receiver_wallet_id'] }, // Performance/Security: Fast lookup for receiver queries
      { unique: true, fields: ['idempotency_key'] } // Security: Enforces uniqueness for replay protection
    ]
  });

  return Transaction;
};
