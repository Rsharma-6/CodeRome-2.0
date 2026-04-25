const express = require('express');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

const router = express.Router();

// GET /problems — list all problems (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { difficulty, tag, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (tag) filter.tags = tag;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const problems = await Problem.find(filter)
      .select('title difficulty tags createdAt testCases')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Problem.countDocuments(filter);

    // Count test cases without exposing hidden ones in the list
    const withCounts = problems.map(p => ({
      ...p.toObject(),
      testCaseCount: p.testCases.length,
      hiddenTestCaseCount: p.testCases.filter(tc => tc.isHidden).length,
      testCases: undefined, // strip from list response
    }));

    res.json({ problems: withCounts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /problems/:id
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const publicProblem = problem.toObject();
    publicProblem.testCases = problem.testCases.filter(tc => !tc.isHidden);
    res.json(publicProblem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /problems/:id/full — admin: full problem including hidden test cases
router.get('/:id/full', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /problems/:id/all-testcases — internal: returns all test cases for evaluation
router.get('/:id/all-testcases', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select('testCases codeStubs');
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    let driverCode = '';
    if (req.query.language) {
      const stub = problem.codeStubs.find(s => s.language === req.query.language);
      driverCode = stub?.driverCode || '';
    }

    res.json({ testCases: problem.testCases, driverCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /problems — create a problem (admin only — enforced at api-gateway)
router.post('/', async (req, res) => {
  try {
    const problem = await Problem.create(req.body);
    res.status(201).json(problem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /problems/:id — update (admin only — enforced at api-gateway)
router.put('/:id', async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /problems/:id — admin only — enforced at api-gateway
router.delete('/:id', async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    // Also delete related submissions
    await Submission.deleteMany({ problemId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /problems/stats/summary — admin stats
router.get('/stats/summary', async (req, res) => {
  try {
    const [total, easy, medium, hard] = await Promise.all([
      Problem.countDocuments(),
      Problem.countDocuments({ difficulty: 'easy' }),
      Problem.countDocuments({ difficulty: 'medium' }),
      Problem.countDocuments({ difficulty: 'hard' }),
    ]);
    res.json({ total, easy, medium, hard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
