const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');

const router = express.Router();

// POST /users — create user (called by api-gateway on register)
router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ username, email, passwordHash });
    await UserProgress.create({ userId: user._id });

    res.status(201).json(user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users — list all users (admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter)
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);
    res.json({ users, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/email/:email — find user by email (for login — internal only)
router.get('/email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user); // includes passwordHash — internal use only
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id — get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/:id/refresh-tokens — add or remove refresh token
router.patch('/:id/refresh-tokens', async (req, res) => {
  try {
    const { action, token } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'add') {
      user.refreshTokens.push(token);
    } else if (action === 'remove') {
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    }
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/:id/role — set isAdmin (admin only — enforced at api-gateway)
router.patch('/:id/role', async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: Boolean(isAdmin) },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/:id/ban — ban or unban user (admin only — enforced at api-gateway)
router.patch('/:id/ban', async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: Boolean(isBanned), refreshTokens: isBanned ? [] : undefined },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /users/:id — delete user (admin only — enforced at api-gateway)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await UserProgress.deleteOne({ userId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id/progress
router.get('/:id/progress', async (req, res) => {
  try {
    const progress = await UserProgress.findOne({ userId: req.params.id })
      .populate('solvedProblems', 'title difficulty');
    if (!progress) return res.status(404).json({ error: 'Progress not found' });
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/:id/progress/solved — mark problem as solved
router.post('/:id/progress/solved', async (req, res) => {
  try {
    const { problemId, difficulty } = req.body;
    const progress = await UserProgress.findOne({ userId: req.params.id });
    if (!progress) return res.status(404).json({ error: 'Progress not found' });

    if (!progress.solvedProblems.includes(problemId)) {
      progress.solvedProblems.push(problemId);
      progress.acceptedCount += 1;
      if (difficulty === 'easy') progress.easyCount += 1;
      else if (difficulty === 'medium') progress.mediumCount += 1;
      else if (difficulty === 'hard') progress.hardCount += 1;
    }
    progress.submissionCount += 1;
    progress.lastActive = new Date();
    await progress.save();
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
