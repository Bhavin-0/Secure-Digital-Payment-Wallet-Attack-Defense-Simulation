const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

// SEC: [OWASP A03:2021-Injection] - Strict input validation to prevent SQLi, NoSQLi, and malformed payload attacks
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
];

// SEC: [OWASP A03:2021-Injection] - Input validation on login to prevent injection via login form
const loginValidation = [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, authController.register);

// SEC: [OWASP A07:2021-Identification and Authentication Failures] - Apply rate limiter middleware specifically to the login route
router.post('/login', loginLimiter, loginValidation, authController.login);

module.exports = router;
