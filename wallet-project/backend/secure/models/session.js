const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      // Security: Unique session identifier
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Security: Links session precisely to an authenticated user
    },
    refresh_token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      // Security: Hashed refresh token to limit damage if the DB is dumped
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
      // Security: Tracks origin IP for detecting unusual behavior (supports IPv6)
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Security: Tracks browser/device to identify potential session hijacking
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      // Security: Allows immediate manual or automated termination of active sessions
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      // Security: Absolute token expiration time for token rotation enforcement
    }
  }, {
    tableName: 'sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] }, // Performance/Security: To lookup/revoke all sessions for a user
      { fields: ['refresh_token_hash'] } // Performance/Security: Indexed to find specific tokens efficiently
    ]
  });

  return Session;
};
