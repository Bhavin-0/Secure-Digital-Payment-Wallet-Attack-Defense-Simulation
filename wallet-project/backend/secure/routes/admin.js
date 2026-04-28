const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/security-events', adminController.getSecurityEvents);

module.exports = router;
