const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      // Security: Unique identifier for each log entry
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, // Null for system/unauthenticated actions
      // Security: Attributes actions to specific users for non-repudiation
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      // Security: Categorizes the precise action taken (e.g., 'WITHDRAWAL_FAILED')
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
      // Security: Identifies the target of the action (e.g., wallet ID, user ID)
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      // Security: Logs the network origin of the action
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      // Security: Stores immutable JSON metadata payload (e.g., { amount: 500, status: 'failed' })
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at', // Correctly maps Sequelize's default 'createdAt' to the DB's 'created_at'
    updatedAt: false, // Security: Audit logs should be strictly append-only (no updates)
    indexes: [
      { fields: ['user_id'] }, // Performance/Security: Querying logs for a specific user
      { fields: ['action'] } // Performance/Security: Querying logs for specific events
    ]
  });

  return AuditLog;
};
