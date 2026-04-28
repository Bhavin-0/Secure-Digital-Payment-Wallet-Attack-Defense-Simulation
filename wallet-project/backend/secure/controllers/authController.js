const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Session, AuditLog } = require('../models');

exports.register = async (req, res) => {
  // SEC: [OWASP A03:2021-Injection] - Enforce input validation defined in the route middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // SEC: [OWASP A02:2021-Cryptographic Failures] - Hash password using bcrypt with a strong work factor (cost 12)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // SEC: [OWASP A03:2021-Injection] - Sequelize ORM automatically uses parameterized queries to prevent SQL injection
    const newUser = await User.create({
      email: email,
      password_hash: passwordHash
    });

    await AuditLog.create({ action: 'USER_REGISTERED', user_id: newUser.id, resource: email, ip_address: req.ip || 'unknown', details: { status: 'normal' } });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    // SEC: [OWASP A05:2021-Security Misconfiguration] - Catch-all error response prevents stack traces from leaking to the client
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  // SEC: [OWASP A03:2021-Injection] - Enforce input validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // SEC: [OWASP A03:2021-Injection] - Parameterized query by Sequelize
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      await AuditLog.create({ action: 'LOGIN_FAILED', resource: email, ip_address: req.ip || 'unknown', details: { status: 'blocked', reason: 'User not found' } });
      // SEC: [OWASP A07:2021-Identification and Authentication Failures] - Generic error message prevents username/email enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // SEC: [OWASP A02:2021-Cryptographic Failures] - Securely compare submitted plaintext against stored bcrypt hash (mitigates timing attacks)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      await AuditLog.create({ action: 'LOGIN_FAILED', resource: email, ip_address: req.ip || 'unknown', details: { status: 'blocked', reason: 'Invalid password' } });
      // SEC: [OWASP A07:2021-Identification and Authentication Failures] - Generic error message prevents username/email enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // SEC: [OWASP A07:2021-Identification and Authentication Failures] - Short-lived access token (15 mins) minimizes window of opportunity if stolen
    const accessToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );

    // SEC: [OWASP A02:2021-Cryptographic Failures] - High-entropy random string for refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // SEC: [OWASP A02:2021-Cryptographic Failures] - Hash refresh token before DB storage so database compromise doesn't compromise active tokens
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await AuditLog.create({ action: 'LOGIN_SUCCESS', user_id: user.id, resource: 'session', ip_address: req.ip || 'unknown', details: { status: 'normal' } });

    // SEC: [OWASP A03:2021-Injection] - Parameterized insert via Sequelize
    await Session.create({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      ip_address: req.ip || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    // SEC: [OWASP A07:2021-Identification and Authentication Failures] - Store refresh token in secure, httpOnly cookie (mitigates XSS token theft)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // SEC: [OWASP A03:2021-Injection (XSS)] - Cookie cannot be accessed via document.cookie in JS
      secure: process.env.NODE_ENV === 'production', // SEC: [OWASP A02:2021-Cryptographic Failures] - Transmit only over HTTPS in production
      sameSite: 'strict', // SEC: [OWASP A01:2021-Broken Access Control (CSRF)] - Prevent Cross-Site Request Forgery
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (matches DB expiry)
    });

    res.status(200).json({ 
      message: 'Login successful',
      accessToken: accessToken 
    });
  } catch (error) {
    // SEC: [OWASP A05:2021-Security Misconfiguration] - Generic error preventing internal details leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};
