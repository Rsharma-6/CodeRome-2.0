const express = require('express');
const axios = require('axios');
const { enqueueCompilation } = require('../producers/index');
const logger = require('../config/logger');

const router = express.Router();
const COMPILER_URL = () => process.env.COMPILER_SERVICE_URL || 'http://localhost:5001';

// POST /compile — synchronous compile (proxies to compiler-service)
router.post('/compile', async (req, res) => {
  try {
    const { data } = await axios.post(`${COMPILER_URL()}/compile`, req.body, {
      timeout: 120000,
    });
    res.json(data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Compiler service unavailable' });
    }
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// POST /compile/queue — async compile via Bull MQ (result delivered via Socket.IO)
router.post('/compile/queue', async (req, res) => {
  try {
    const { roomId, code, language, stdin } = req.body;
    if (!roomId || !code || !language) {
      return res.status(400).json({ error: 'roomId, code, and language are required' });
    }
    const jobId = await enqueueCompilation({ roomId, code, language, stdin });
    logger.info('Compile job queued', { jobId, roomId, language });
    res.json({ jobId, status: 'queued' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
