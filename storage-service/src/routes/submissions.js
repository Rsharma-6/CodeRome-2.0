const express = require('express');
const Submission = require('../models/Submission');
const Message = require('../models/Message');

const router = express.Router();

// POST /submissions — create a new submission (PENDING)
router.post('/', async (req, res) => {
  try {
    const submission = await Submission.create({ ...req.body, status: 'PENDING' });
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /submissions/:id — update submission status + results (called by realtime-service after evaluation)
router.patch('/:id', async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /submissions/:id
router.get('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /submissions?userId=...&problemId=...
router.get('/', async (req, res) => {
  try {
    const { userId, problemId, roomId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (problemId) filter.problemId = problemId;
    if (roomId) filter.roomId = roomId;

    const submissions = await Submission.find(filter)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Submission.countDocuments(filter);
    res.json({ submissions, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Chat messages ---

// GET /messages/:roomId — last 50 messages
router.get('/messages/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /messages — save a chat message
router.post('/messages', async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
