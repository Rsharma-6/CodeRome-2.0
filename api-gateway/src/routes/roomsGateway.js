const express = require('express');
const axios = require('axios');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
});

router.use(requireAuth);

// POST /rooms — create a named room
router.post('/', async (req, res) => {
  try {
    const { name, problemId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Room name is required' });
    const roomId = uuidv4();
    const { data } = await axios.post(`${STORAGE_URL()}/rooms`, {
      roomId,
      name: name.trim(),
      createdBy: req.user.userId,
      problemId: problemId || null,
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /rooms/my — rooms created by current user
router.get('/my', async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/rooms`, {
      params: { createdBy: req.user.userId },
    });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /rooms/:roomId — get room details (must be member or creator)
router.get('/:roomId', async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/rooms/${req.params.roomId}`);
    const isMember = data.members?.some(id => id.toString() === req.user.userId);
    const isCreator = data.createdBy?.toString() === req.user.userId;
    if (!isMember && !isCreator) return res.status(403).json({ error: 'Not a member of this room' });
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// DELETE /rooms/:roomId — only creator can delete
router.delete('/:roomId', async (req, res) => {
  try {
    const { data: room } = await axios.get(`${STORAGE_URL()}/rooms/${req.params.roomId}`);
    if (room.createdBy?.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the creator can delete this room' });
    }
    await axios.delete(`${STORAGE_URL()}/rooms/${req.params.roomId}`);

    // Clear Redis keys if room is still active
    const keys = await redis.keys(`room:${req.params.roomId}:*`);
    if (keys.length > 0) await redis.del(...keys);

    res.json({ ok: true });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

module.exports = router;
