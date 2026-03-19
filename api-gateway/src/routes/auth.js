const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();
const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const { data: user } = await axios.post(`${STORAGE_URL()}/users`, { username, email, password });

    const tokenPayload = { userId: user._id, username: user.username, email: user.email, isAdmin: false };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await axios.patch(`${STORAGE_URL()}/users/${user._id}/refresh-tokens`, {
      action: 'add',
      token: refreshToken,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('User registered', { username, email });
    res.status(201).json({ accessToken, user });
  } catch (err) {
    if (err.response?.status === 409) {
      return res.status(409).json({ error: err.response.data.error });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user } = await axios.get(`${STORAGE_URL()}/users/email/${encodeURIComponent(email)}`);

    // Reject banned users before checking password
    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn('Failed login attempt', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // isAdmin goes into the JWT so requireAdmin middleware works without a DB hit
    const tokenPayload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || false,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await axios.patch(`${STORAGE_URL()}/users/${user._id}/refresh-tokens`, {
      action: 'add',
      token: refreshToken,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('User login', { email, userId: user._id });
    const publicUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || false,
      profile: user.profile,
    };
    res.json({ accessToken, user: publicUser });
  } catch (err) {
    if (err.response?.status === 404) {
      logger.warn('Failed login attempt', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { data: fullUser } = await axios.get(`${STORAGE_URL()}/users/email/${encodeURIComponent(payload.email)}`);

    // Check ban on refresh too
    if (fullUser.isBanned) {
      res.clearCookie('refreshToken');
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    if (!fullUser.refreshTokens.includes(token)) {
      return res.status(401).json({ error: 'Refresh token revoked' });
    }

    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      isAdmin: fullUser.isAdmin || false, // always re-read isAdmin from DB on refresh
    });

    logger.info('Token refreshed', { userId: payload.userId });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await axios.patch(`${STORAGE_URL()}/users/${payload.userId}/refresh-tokens`, {
          action: 'remove',
          token,
        });
      } catch {
        // ignore invalid token on logout
      }
    }
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user } = await axios.get(`${STORAGE_URL()}/users/${req.user.userId}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
