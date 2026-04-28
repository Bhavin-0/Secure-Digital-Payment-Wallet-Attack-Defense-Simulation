const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security & Parsing Middleware ---
app.use(express.json()); // Parse incoming JSON payloads securely
app.use(cookieParser()); // Required to parse the secure httpOnly refresh cookie
app.disable('x-powered-by'); // SEC: Hide Express framework signature from attackers

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.stack);
  // SEC: Catch-all to prevent stack traces leaking to the client
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Server Initialization ---
const startServer = async () => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`🛡️  Secure backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database or start server:', error);
    process.exit(1);
  }
};

startServer();
