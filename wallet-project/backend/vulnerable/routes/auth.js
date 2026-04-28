const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// VULN: No login attempt limiting (express-rate-limit is entirely omitted)
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
