const mysql = require('mysql2/promise');

// VULN: Hardcoded credentials (in a real scenario)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root@1234', // Matches the password you set in the secure module
  database: 'secure_wallet',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
