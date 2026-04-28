const express = require('express');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Allow JSON parsing

// VULN: No security headers (like Helmet)
// VULN: No Rate Limiting applied globally or on specific routes
// VULN: No CORS restrictions
// VULN: Cookie parser is missing, so we can't use secure httpOnly cookies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// VULN: No global error handler to safely catch and sanitize errors
// Errors will crash the app or leak stack traces to the client

app.listen(PORT, () => {
  console.log(`⚠️  VULNERABLE backend running on http://localhost:${PORT}`);
});
