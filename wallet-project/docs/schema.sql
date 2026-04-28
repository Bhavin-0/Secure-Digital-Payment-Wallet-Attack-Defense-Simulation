-- Security: Use explicit character sets to prevent injection or encoding bypass attacks
CREATE DATABASE IF NOT EXISTS secure_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE secure_wallet;

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY, -- Security: UUIDv4 to prevent Insecure Direct Object Reference (IDOR) attacks
    email VARCHAR(255) UNIQUE NOT NULL, -- Security: Unique login identifier
    password_hash VARCHAR(255) NOT NULL, -- Security: Stores bcrypt hash (cost factor 12), never plain text
    mfa_secret VARCHAR(255) NULL, -- Security: Stores multi-factor auth secret for advanced account protection
    is_active BOOLEAN DEFAULT TRUE, -- Security: Allows account disablement instead of deletion to preserve audit history
    failed_login_attempts INT DEFAULT 0, -- Security: Tracking for brute-force/credential stuffing defense
    locked_until TIMESTAMP NULL, -- Security: Enforces temporary account lockouts after multiple failed attempts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Security: Immutable record of account creation time
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Security: Tracks last modification
);
CREATE INDEX idx_users_email ON users(email); 

CREATE TABLE wallets (
    id CHAR(36) PRIMARY KEY, -- Security: UUIDv4 to prevent enumeration of wallets
    user_id CHAR(36) NOT NULL, -- Security: Links wallet to owner
    balance INT DEFAULT 0, -- Security: Stored in cents/paise (integer) to strictly prevent floating-point precision manipulation
    status ENUM('active', 'frozen', 'closed') DEFAULT 'active', -- Security: Allows freezing funds during suspicious activity
    version INT DEFAULT 0, -- Security: Optimistic concurrency control to prevent race conditions during concurrent transactions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT -- Security: Prevent deletion of users with active wallets
);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY, -- Security: UUIDv4 to prevent enumeration of transactions
    sender_wallet_id CHAR(36) NULL, -- Security: Nullable for system deposits. Source of funds.
    receiver_wallet_id CHAR(36) NULL, -- Security: Nullable for system withdrawals. Destination of funds.
    amount INT NOT NULL, -- Security: Strict integer representation (cents/paise) to prevent fractional cent vulnerabilities
    status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending', -- Security: Tracks state machine of funds movement
    idempotency_key VARCHAR(255) UNIQUE NOT NULL, -- Security: Prevents duplicate transactions from network retries (replay attack defense)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT,
    FOREIGN KEY (receiver_wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT
);
CREATE INDEX idx_transactions_sender ON transactions(sender_wallet_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_wallet_id);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);

CREATE TABLE sessions (
    id CHAR(36) PRIMARY KEY, -- Security: UUIDv4 session identifier
    user_id CHAR(36) NOT NULL, -- Security: Links session to user
    refresh_token_hash VARCHAR(255) NOT NULL, -- Security: Hashed refresh token to prevent use if database is compromised
    ip_address VARCHAR(45) NOT NULL, -- Security: Track origin IP to detect anomalous logins (supports IPv6)
    user_agent TEXT NOT NULL, -- Security: Track device/browser to detect session hijacking
    is_revoked BOOLEAN DEFAULT FALSE, -- Security: Allows immediate invalidation of compromised sessions
    expires_at TIMESTAMP NOT NULL, -- Security: Absolute expiration for token rotation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token_hash);

CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY, -- Security: UUIDv4
    user_id CHAR(36) NULL, -- Security: Actor performing the action (nullable for system actions)
    action VARCHAR(255) NOT NULL, -- Security: Specific action performed (e.g., 'LOGIN_FAILED', 'FUNDS_TRANSFERRED')
    resource VARCHAR(255) NOT NULL, -- Security: Target resource (e.g., 'wallet_id', 'user_id')
    ip_address VARCHAR(45) NULL, -- Security: Source IP of the action
    details JSON NULL, -- Security: Immutable JSON snapshot of the event context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Security: Exact time of the event
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
