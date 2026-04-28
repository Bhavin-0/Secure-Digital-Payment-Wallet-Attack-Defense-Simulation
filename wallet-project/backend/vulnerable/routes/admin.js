const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// VULN: Missing authentication middleware! Anyone can access the admin dashboard data.
router.get('/security-events', adminController.getSecurityEvents);

module.exports = router;
