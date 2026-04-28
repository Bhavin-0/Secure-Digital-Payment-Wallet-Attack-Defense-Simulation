const db = require('../config/db');

exports.getSecurityEvents = async (req, res) => {
  try {
    // VULN: No authentication or role checks. 
    
    // Since the vulnerable version doesn't actively log to audit_logs (because it lacks defenses),
    // we return a basic response so the dashboard doesn't crash when polling.
    
    const [sessions] = await db.query(`SELECT COUNT(*) as count FROM sessions WHERE is_revoked = false`);
    const activeSessions = sessions[0].count;

    // Fetch actual logs to display the attacks on the dashboard
    const [logs] = await db.query(`SELECT id, created_at, action, ip_address, resource, details FROM audit_logs ORDER BY created_at DESC LIMIT 15`);

    const formattedLogs = logs.map(log => {
      // If it's a failed login in the vulnerable version, it's suspicious but NOT blocked
      let status = 'normal';
      if (log.action === 'LOGIN_FAILED') status = 'suspicious'; 

      return {
        id: log.id,
        timestamp: log.created_at,
        eventType: log.action,
        ip: log.ip_address || 'Unknown',
        user: log.resource || 'Unauthenticated',
        status: status 
      };
    });

    res.status(200).json({
      stats: {
        totalRequestsToday: formattedLogs.length,
        blockedAttempts: 0, // VULN: Always 0 because brute force isn't blocked here!
        activeSessions: activeSessions
      },
      chartData: [],
      logs: formattedLogs
    });
  } catch (error) {
    // VULN: Information exposure - Returns raw SQL/internal errors directly to the client
    res.status(500).json({ error: error.message });
  }
};
