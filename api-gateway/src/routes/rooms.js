const express = require('express');
const axios = require('axios');
const Redis = require('ioredis');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
});

// GET /user/active-room
router.get('/active-room', requireAuth, async (req, res) => {
  try {
    // 1. Check Redis grace window first
    const roomId = await redis.get(`user:${req.user.userId}:activeRoom`);
    if (roomId) {
      const roomExists = await redis.exists(`room:${roomId}:creator`);
      if (roomExists) return res.json({ roomId });
      await redis.del(`user:${req.user.userId}:activeRoom`);
    }

    // 2. Fall back to MongoDB — check if user is a member of any persistent room
    try {
      const { data } = await axios.get(`${STORAGE_URL()}/rooms`, {
        params: { createdBy: req.user.userId },
      });
      // Return most recently active room the user created
      const rooms = data.rooms || [];
      if (rooms.length > 0) return res.json({ roomId: rooms[0].roomId });
    } catch {
      // storage-service unavailable — not critical
    }

    res.json({ roomId: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
