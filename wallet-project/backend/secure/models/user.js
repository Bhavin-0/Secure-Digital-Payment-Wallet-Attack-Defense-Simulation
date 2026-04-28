const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      // Security: UUIDs mask the total number of users and prevent IDOR attacks
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true, // Security: Ensure input matches valid email structure
      },
      // Security: Used as the primary login identifier
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      // Security: Stores bcrypt hash (cost 12), NEVER plain text.
    },
    mfa_secret: {
      type: DataTypes.STRING,
      allowNull: true,
      // Security: Secret for Time-based One-Time Passwords (TOTP)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      // Security: Soft-delete/deactivate accounts to preserve forensic audit trails
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      // Security: Counter to track and defend against brute-force/dictionary attacks
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      // Security: Timestamp representing account lockout duration after max failed attempts
    }
  }, {
    tableName: 'users',
    timestamps: true, // Security: Automatically tracks created_at and updated_at for auditing
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['email'] // Performance/Security: Indexed for fast auth lookups
      }
    ]
  });

  return User;
};
