require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const authRoutes = require('./routes/auth');
const problemsRoutes = require('./routes/problems');
const compileRoutes = require('./routes/compile');
const bullBoardAdapter = require('./config/bullBoard');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info('HTTP request', { method: req.method, path: req.path, status: res.statusCode, ip: req.ip });
  });
  next();
});

// Bull Board dashboard
app.use('/admin/queues', bullBoardAdapter.getRouter());

const adminRoutes = require('./routes/admin');
const roomsRoutes = require('./routes/rooms');
const roomsGatewayRoutes = require('./routes/roomsGateway');

// Routes
app.use('/auth', authRoutes);
app.use('/problems', problemsRoutes);
app.use('/', compileRoutes);
app.use('/admin', adminRoutes);
app.use('/user', roomsRoutes);
app.use('/rooms', roomsGatewayRoutes);

// Proxy to storage-service for user progress (public)
app.get('/users/:id', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${process.env.STORAGE_SERVICE_URL || 'http://localhost:5002'}/users/${req.params.id}`
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Running on port ${PORT}`);
  logger.info(`Bull Board: http://localhost:${PORT}/admin/queues`);
});
