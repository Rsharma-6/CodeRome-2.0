const express = require('express');
const axios = require('axios');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { enqueueSubmission, enqueueAI } = require('../producers/index');

const router = express.Router();
const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

// GET /problems
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/problems`, { params: req.query });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /problems/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/problems/${req.params.id}`);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// POST /problems/:id/submit
router.post('/:id/submit', optionalAuth, async (req, res) => {
  try {
    const { roomId, code, language } = req.body;
    if (!roomId || !code || !language) {
      return res.status(400).json({ error: 'roomId, code, and language are required' });
    }

    // Get all test cases (including hidden) and driverCode from storage service
    const { data: tcData } = await axios.get(
      `${STORAGE_URL()}/problems/${req.params.id}/all-testcases?language=${language}`
    );
    const { testCases, driverCode } = tcData;

    // Create submission record
    const { data: submission } = await axios.post(`${STORAGE_URL()}/submissions`, {
      roomId,
      userId: req.user?.userId || null,
      problemId: req.params.id,
      code,
      language,
      status: 'PENDING',
    });

    // Enqueue for evaluation
    await enqueueSubmission({
      submissionId: submission._id,
      userId: req.user?.userId || null,
      roomId,
      problemId: req.params.id,
      code,
      language,
      testCases,
      driverCode,
    });

    res.json({ submissionId: submission._id, status: 'PENDING' });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /submissions — user's submission history
router.get('/submissions/history', requireAuth, async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/submissions`, {
      params: { userId: req.user.userId, ...req.query },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /progress — user progress stats
router.get('/progress/me', requireAuth, async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/users/${req.user.userId}/progress`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/request — enqueue AI job
router.post('/ai/request', optionalAuth, async (req, res) => {
  try {
    const { roomId, type, problemId, code, language, hintNumber, messages } = req.body;
    await enqueueAI({ roomId, type, problemId, code, language, hintNumber, messages });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
