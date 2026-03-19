require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const usersRouter = require('./routes/users');
const problemsRouter = require('./routes/problems');
const submissionsRouter = require('./routes/submissions');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info('HTTP request', { method: req.method, path: req.path, status: res.statusCode, ip: req.ip });
  });
  next();
});

app.use('/users', usersRouter);
app.use('/problems', problemsRouter);
app.use('/submissions', submissionsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'storage-service' }));

const PORT = process.env.PORT || 5002;

connectDB()
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
  });
