require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const corsOptions = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3002')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Veta Wallet DB connected successfully');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Veta Wallet DB models synchronized');
    }

    app.listen(PORT, () => {
      console.log(`Veta Wallet API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start Veta Wallet API:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
