const express = require('express');
const axios = require('axios');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { enqueueSubmission, enqueueAI } = require('../producers/index');

function normalizeOutput(s) {
  return (s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

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

// POST /problems/:id/run — run visible test cases only (synchronous)
router.post('/:id/run', optionalAuth, async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) return res.status(400).json({ error: 'code and language are required' });

    const COMPILER_URL = () => process.env.COMPILER_SERVICE_URL || 'http://localhost:5001';

    const { data: tcData } = await axios.get(
      `${STORAGE_URL()}/problems/${req.params.id}/all-testcases?language=${language}`
    );
    const { testCases, driverCode } = tcData;
    const visibleCases = testCases.filter(tc => !tc.isHidden).slice(0, 3);
    const fullCode = driverCode ? `${code}\n\n${driverCode}` : code;

    const results = await Promise.all(visibleCases.map(async (tc) => {
      try {
        const { data } = await axios.post(`${COMPILER_URL()}/compile`, {
          code: fullCode, language, stdin: tc.input,
        }, { timeout: 15000 });
        const actual = normalizeOutput(data.output);
        const expected = normalizeOutput(tc.expectedOutput);
        return { input: tc.input, expected, actual, passed: data.exitCode === 0 && actual === expected, error: data.error || null };
      } catch {
        return { input: tc.input, expected: tc.expectedOutput, actual: '', passed: false, error: 'Execution failed' };
      }
    }));

    res.json({ results });
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

    // Enqueue for evaluation — submission record is created by resultWorker on completion
    await enqueueSubmission({
      userId: req.user?.userId || null,
      roomId,
      problemId: req.params.id,
      code,
      language,
      testCases,
      driverCode,
    });

    res.json({ status: 'queued' });
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
