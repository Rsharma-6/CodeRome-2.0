const express = require('express');
const axios = require('axios');
const Redis = require('ioredis');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

// Shared Redis client for room lookups
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
});

// All routes require admin
router.use(requireAdmin);

// ---------------------
// Stats
// ---------------------
router.get('/stats', async (req, res) => {
  try {
    const [usersRes, problemsRes, submissionsRes] = await Promise.all([
      axios.get(`${STORAGE_URL()}/users`),
      axios.get(`${STORAGE_URL()}/problems/stats/summary`),
      axios.get(`${STORAGE_URL()}/submissions`, { params: { limit: 1 } }),
    ]);

    // Count active rooms from Redis
    const roomKeys = await redis.keys('room:*:users');
    const uniqueRooms = new Set(roomKeys.map(k => k.split(':')[1]));
    const activeRooms = uniqueRooms.size;

    res.json({
      totalUsers: usersRes.data.total,
      problems: problemsRes.data,
      totalSubmissions: submissionsRes.data.total,
      activeRooms,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------
// Users
// ---------------------
router.get('/users', async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/users`, { params: req.query });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    // Prevent self-demotion
    if (req.params.id === req.user.userId && req.body.isAdmin === false) {
      return res.status(400).json({ error: 'You cannot remove your own admin role' });
    }
    const { data } = await axios.patch(`${STORAGE_URL()}/users/${req.params.id}/role`, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.patch('/users/:id/ban', async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot ban yourself' });
    }
    const { data } = await axios.patch(`${STORAGE_URL()}/users/${req.params.id}/ban`, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account from here' });
    }
    const { data } = await axios.delete(`${STORAGE_URL()}/users/${req.params.id}`);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// ---------------------
// Problems
// ---------------------
router.get('/problems', async (req, res) => {
  try {
    const { data } = await axios.get(`${STORAGE_URL()}/problems`, {
      params: { ...req.query, limit: req.query.limit || 50 },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/problems/:id', async (req, res) => {
  try {
    // Admin gets the full problem including hidden test cases
    const { data } = await axios.get(`${STORAGE_URL()}/problems/${req.params.id}/full`);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.post('/problems', async (req, res) => {
  try {
    const { data } = await axios.post(`${STORAGE_URL()}/problems`, req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.put('/problems/:id', async (req, res) => {
  try {
    const { data } = await axios.put(`${STORAGE_URL()}/problems/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.delete('/problems/:id', async (req, res) => {
  try {
    const { data } = await axios.delete(`${STORAGE_URL()}/problems/${req.params.id}`);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// ---------------------
// Rooms
// ---------------------
router.get('/rooms', async (req, res) => {
  try {
    const roomKeys = await redis.keys('room:*:users');
    const roomIds = [...new Set(roomKeys.map(k => k.split(':')[1]))];

    const rooms = await Promise.all(
      roomIds.map(async (roomId) => {
        const users = await redis.hgetall(`room:${roomId}:users`) || {};
        const members = Object.values(users).map(u => {
          try { return JSON.parse(u); } catch { return {}; }
        });
        return { roomId, memberCount: members.length, members };
      })
    );

    res.json({ rooms, total: rooms.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const keys = await redis.keys(`room:${roomId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    res.json({ ok: true, cleared: keys.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
