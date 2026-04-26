const express = require('express');
const { executeCode } = require('../executors/jdoodleExecutor');

const router = express.Router();

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

router.post('/submit', async (req, res) => {
  const { code, language, stdin, expectedOutput } = req.body;
  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }
  try {
    const result = await executeCode(language, code, stdin || '');
    const actualOutput  = (result.output || '').replace(/\r\n/g, '\n').trim();
    const expected      = (expectedOutput || '').replace(/\r\n/g, '\n').trim();
    const passed        = !result.error && actualOutput === expected;
    res.json({ ...result, passed, expectedOutput: expected, actualOutput });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'piston-compiler-service' });
});

module.exports = router;
