const express = require('express');
const { executeCode } = require('../executors/codeExecutor');

const router = express.Router();

// Direct HTTP compile (synchronous — for quick runs from api-gateway or server/)
// POST /compile { code, language, stdin? }
router.post('/compile', async (req, res) => {
  const { code, language, stdin } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  try {
    const result = await executeCode(language, code, stdin || '');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /submit { code, language, stdin, expectedOutput }
// Runs code and compares to expected output (single test case sync version)
router.post('/submit', async (req, res) => {
  const { code, language, stdin, expectedOutput } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  try {
    const result = await executeCode(language, code, stdin || '');
    const actualOutput = (result.output || '').trim();
    const expected = (expectedOutput || '').trim();
    const passed = !result.error && actualOutput === expected;

    res.json({ ...result, passed, expectedOutput: expected, actualOutput });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'compiler-service' });
});

module.exports = router;
