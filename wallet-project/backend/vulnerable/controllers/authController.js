const db = require('../config/db'); // Assuming a raw MySQL connection pool

exports.register = async (req, res) => {
  // VULN: No input validation on email/password fields (missing length/format checks)
  const email = req.body.email;
  const password = req.body.password;

  try {
    // VULN: SQL queries built with string concatenation (SQLi surface)
    // VULN: Plaintext password storage (saving raw password into password_hash)
    const query = `INSERT INTO users (id, email, password_hash) VALUES (UUID(), '${email}', '${password}')`;
    
    await db.query(query);
    
    // Log registration
    const safeEmail = email ? email.replace(/'/g, "''") : 'unknown';
    await db.query(`INSERT INTO audit_logs (id, action, resource, ip_address, details) VALUES (UUID(), 'USER_REGISTERED', '${safeEmail}', '${req.ip}', '{"status": "normal"}')`);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  // VULN: No input validation on email/password fields
  const email = req.body.email;
  const password = req.body.password;

  try {
    // VULN: SQL queries built with string concatenation (SQLi surface allows authentication bypass)
    // VULN: Plaintext password comparison
    const query = `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${password}'`;
    
    const [users] = await db.query(query);

    // VULN: No login attempt limiting (No failed_login_attempts tracking or locking logic)
    if (users && users.length > 0) {
      const user = users[0];

      // Log successful login using the actual user's email to prevent the SQLi payload from crashing this second query!
      await db.query(`INSERT INTO audit_logs (id, action, resource, ip_address, details) VALUES (UUID(), 'LOGIN_SUCCESS', '${user.email}', '${req.ip}', '{"status": "normal"}')`);

      // VULN: Session token is just Math.random() (predictable, low entropy, easily brute-forced)
      const sessionToken = Math.random().toString();

      // Saving the predictable token to the database
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const sessionQuery = `
        INSERT INTO sessions (id, user_id, refresh_token_hash, ip_address, user_agent, expires_at) 
        VALUES (UUID(), '${user.id}', '${sessionToken}', '${ipAddress}', '${userAgent}', DATE_ADD(NOW(), INTERVAL 24 HOUR))
      `;
      
      await db.query(sessionQuery);

      res.status(200).json({ 
        message: 'Login successful', 
        token: sessionToken 
      });
    } else {
      // VULN: We log the failure so you can see it on the dashboard, but we DO NOT block them!
      const safeEmail = email ? email.replace(/'/g, "''") : 'unknown';
      await db.query(`INSERT INTO audit_logs (id, action, resource, ip_address, details) VALUES (UUID(), 'LOGIN_FAILED', '${safeEmail}', '${req.ip}', '{"status": "suspicious"}')`);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
