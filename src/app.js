require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const { startSweeper } = require('./services/VerificationDecisionService');

const authRoutes = require('./routes/authRoutes');
const appRoutes = require('./routes/appRoutes');
const adminRoutes = require('./routes/adminRoutes');
const kycRoutes = require('./routes/kycRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Behind a load balancer (e.g. AWS ALB) in production, trust the first proxy
// so rate limiting and req.ip use the real client IP from X-Forwarded-For.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('combined'));
// Higher limit to allow base64-encoded document/selfie images from the KYC flow
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// CORS
const corsOptions = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kyc', kycRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error middleware
app.use(errorMiddleware);

// Database sync and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Sync database
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // In production, migrations are the single source of truth for schema
    // changes — sync() here would create the modern schema straight from
    // the current models on first boot, before migrations ever run, which
    // makes every later migration fail with "already exists". Only sync
    // (with alter) in development, where there's no separate migration
    // discipline to protect.
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized');
    }

    startSweeper();

    app.listen(PORT, () => {
      console.log(`GENESIS ID server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
