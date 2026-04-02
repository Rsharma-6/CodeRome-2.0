require('dotenv').config();
const express = require('express');
const logger = require('./config/logger');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const Redis = require('ioredis');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const ACTIONS = require('../Actions');
const startResultWorker = require('./workers/resultWorker');
const startAIWorker = require('./workers/aiWorker');
const { ResultQueue, AIQueue } = require('./queues/index');
const { enqueueAI } = require('./producers/index');

const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// ---------------------
// Redis Setup (for room state)
// ---------------------
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
});

// ---------------------
// Socket.IO
// ---------------------
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ---------------------
// Bull Board
// ---------------------
const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(ResultQueue), new BullMQAdapter(AIQueue)],
  serverAdapter: bullBoardAdapter,
});
app.use('/admin/queues', bullBoardAdapter.getRouter());

// ---------------------
// Room Helpers
// ---------------------
async function addUserToRoom(roomId, socketId, username, userId = null, role = 'editor') {
  const key = userId || socketId;
  await redis.hset(`room:${roomId}:users`, key, JSON.stringify({ username, userId, role, socketId }));
}

async function removeUserFromRoom(roomId, userId, socketId) {
  const key = userId || socketId;
  await redis.hdel(`room:${roomId}:users`, key);
}

async function getAllConnectedClients(roomId) {
  const users = await redis.hgetall(`room:${roomId}:users`) || {};
  return Object.values(users).map(raw => JSON.parse(raw));
}

async function getUserDataBySocketId(roomId, socketId) {
  const users = await redis.hgetall(`room:${roomId}:users`) || {};
  for (const raw of Object.values(users)) {
    const data = JSON.parse(raw);
    if (data.socketId === socketId) return data;
  }
  return null;
}

async function saveRoomUpdate(roomId, update) {
  await redis.rpush(`room:${roomId}:updates`, JSON.stringify(update));
}

async function getRoomUpdates(roomId) {
  const updates = await redis.lrange(`room:${roomId}:updates`, 0, -1);
  return updates.map((u) => JSON.parse(u));
}

// ---------------------
// Rate Limiter (in-memory, per socket)
// ---------------------
const rateLimit = {};
function canRunCode(socketId, limitMs = 5000) {
  const now = Date.now();
  if (rateLimit[socketId] && now - rateLimit[socketId] < limitMs) return false;
  rateLimit[socketId] = now;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const id in rateLimit) {
    if (now - rateLimit[id] > 60000) delete rateLimit[id];
  }
}, 60000);

// ---------------------
// Socket.IO Events
// ---------------------
io.on('connection', (socket) => {
  // --- Room ---
  socket.on(ACTIONS.JOIN, async ({ roomId, username, userId, role, problemId }) => {
    // Deduplicate: kick existing socket for this userId
    if (userId) {
      const existing = await redis.hget(`room:${roomId}:users`, userId);
      if (existing) {
        const existingData = JSON.parse(existing);
        const oldSocket = io.sockets.sockets.get(existingData.socketId);
        if (oldSocket && oldSocket.id !== socket.id) {
          await redis.hdel(`room:${roomId}:users`, userId);
          oldSocket.emit(ACTIONS.KICKED, { kickedBy: 'session replaced' });
          oldSocket.disconnect(true);
        }
      }
      await redis.set(`user:${userId}:activeRoom`, roomId, 'EX', 86400);
    }

    await addUserToRoom(roomId, socket.id, username, userId || null, role || 'editor');

    // Cancel any pending expiry — room is active again
    await redis.persist(`room:${roomId}:users`);
    await redis.persist(`room:${roomId}:problemId`);
    await redis.persist(`room:${roomId}:updates`);
    await redis.persist(`room:${roomId}:creator`);

    socket.join(roomId);

    // Track room creator (first joiner)
    const existingCreator = await redis.get(`room:${roomId}:creator`);
    if (!existingCreator) await redis.set(`room:${roomId}:creator`, socket.id);
    const creatorSocketId = existingCreator || socket.id;

    // Store problemId in Redis if this is the first one set for the room
    if (problemId) {
      const existing = await redis.get(`room:${roomId}:problemId`);
      if (!existing) await redis.set(`room:${roomId}:problemId`, problemId);
    }

    logger.info('User joined room', { roomId, username, socketId: socket.id });
    const clients = await getAllConnectedClients(roomId);
    const storedProblemId = await redis.get(`room:${roomId}:problemId`);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, { clients, username, socketId: socket.id, problemId: storedProblemId || null, creatorSocketId });
    });

    // Load chat history for the newly joined user
    try {
      const { data: messages } = await axios.get(`${STORAGE_URL()}/submissions/messages/${roomId}`);
      socket.emit(ACTIONS.CHAT_HISTORY, { messages });
    } catch {
      socket.emit(ACTIONS.CHAT_HISTORY, { messages: [] });
    }

    // If no live code updates in Redis, load persisted snapshot from MongoDB
    const updateCount = await redis.llen(`room:${roomId}:updates`);
    if (updateCount === 0) {
      try {
        const { data: room } = await axios.get(`${STORAGE_URL()}/rooms/${roomId}`);
        if (room.code) socket.emit(ACTIONS.CODE_CHANGE, { update: { type: 'init', code: room.code } });
        if (room.problemId && !storedProblemId) socket.emit(ACTIONS.PROBLEM_CHANGED, { problemId: room.problemId, changedBy: null });
        if (room.language) socket.emit('room:language', { language: room.language });
      } catch {
        // room not in MongoDB yet — new room, ignore
      }
    }

    // Add user to room members in MongoDB (non-blocking)
    if (userId) {
      axios.patch(`${STORAGE_URL()}/rooms/${roomId}`, { addMember: userId }).catch(() => {});
    }
  });

  // --- Kick Member ---
  socket.on(ACTIONS.KICK_MEMBER, async ({ roomId, targetSocketId }) => {
    const creator = await redis.get(`room:${roomId}:creator`);
    if (creator !== socket.id) return;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!targetSocket) return;
    const kickerData = await getUserDataBySocketId(roomId, socket.id);
    const targetData = await getUserDataBySocketId(roomId, targetSocketId);
    targetSocket.emit(ACTIONS.KICKED, { kickedBy: kickerData?.username || 'Room creator' });
    targetSocket.disconnect(true);
    logger.info('Member kicked', { roomId, targetSocketId, kickedBy: socket.id, kickedUser: targetData?.username });
  });

  // --- Problem Change ---
  socket.on(ACTIONS.CHANGE_PROBLEM, async ({ roomId, problemId, username }) => {
    if (!roomId || !problemId) return;
    await redis.set(`room:${roomId}:problemId`, problemId);
    io.to(roomId).emit(ACTIONS.PROBLEM_CHANGED, { problemId, changedBy: username });
    logger.info('Problem changed', { roomId, problemId, changedBy: username });
  });

  // --- Code Sync ---
  socket.on(ACTIONS.CODE_CHANGE, async ({ roomId, update }) => {
    await saveRoomUpdate(roomId, update);
    socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { update });
  });

  socket.on(ACTIONS.SYNC_CODE, async ({ socketId, roomId }) => {
    const updates = await getRoomUpdates(roomId);
    updates.forEach((update) => {
      io.to(socketId).emit(ACTIONS.CODE_CHANGE, { update });
    });
  });

  socket.on(ACTIONS.SYNC_OUTPUT, async ({ roomId, output, language, triggeredBy }) => {
    socket.to(roomId).emit(ACTIONS.SYNC_OUTPUT, { output, language, triggeredBy });
  });

  socket.on('sync-output-single', ({ socketId, output, language }) => {
    io.to(socketId).emit(ACTIONS.SYNC_OUTPUT, { output, language });
  });

  // --- Chat ---
  socket.on(ACTIONS.CHAT_SEND, async ({ roomId, content }) => {
    const userData = await getUserDataBySocketId(roomId, socket.id);
    if (!userData) return;

    const message = {
      roomId,
      userId: userData.userId,
      username: userData.username,
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
    };

    // Persist message
    try {
      await axios.post(`${STORAGE_URL()}/submissions/messages`, message);
    } catch {
      // non-critical
    }

    io.to(roomId).emit(ACTIONS.CHAT_MESSAGE, message);
  });

  // --- AI ---
  socket.on(ACTIONS.AI_REQUEST, async ({ roomId, type, problemId, code, language, hintNumber, messages }) => {
    if (!canRunCode(socket.id, 3000)) {
      socket.emit(ACTIONS.AI_ERROR, { error: 'Please wait before sending another AI request' });
      return;
    }

    try {
      await enqueueAI({ roomId, type, problemId, code, language, hintNumber, messages });
    } catch (err) {
      socket.emit(ACTIONS.AI_ERROR, { error: 'Failed to queue AI request' });
    }
  });

  // --- Save Code Snapshot ---
  socket.on(ACTIONS.SAVE_CODE, async ({ roomId, code, language }) => {
    if (!roomId || code === undefined) return;
    axios.patch(`${STORAGE_URL()}/rooms/${roomId}`, { code, language }).catch(() => {});
  });

  // --- Video Signaling ---
  socket.on(ACTIONS.VIDEO_JOIN, ({ roomId }) => {
    socket.to(roomId).emit(ACTIONS.VIDEO_JOIN, { socketId: socket.id });
  });

  socket.on(ACTIONS.VIDEO_OFFER, ({ to, offer }) => {
    io.to(to).emit(ACTIONS.VIDEO_OFFER, { from: socket.id, offer });
  });

  socket.on(ACTIONS.VIDEO_ANSWER, ({ to, answer }) => {
    io.to(to).emit(ACTIONS.VIDEO_ANSWER, { from: socket.id, answer });
  });

  socket.on(ACTIONS.VIDEO_ICE_CANDIDATE, ({ to, candidate }) => {
    io.to(to).emit(ACTIONS.VIDEO_ICE_CANDIDATE, { from: socket.id, candidate });
  });

  socket.on(ACTIONS.VIDEO_LEAVE, ({ roomId }) => {
    socket.to(roomId).emit(ACTIONS.VIDEO_LEAVE, { socketId: socket.id });
  });

  // --- Disconnect ---
  socket.on('disconnecting', async () => {
    const rooms = [...socket.rooms].filter(r => r !== socket.id);
    for (const roomId of rooms) {
      const user = await getUserDataBySocketId(roomId, socket.id);
      logger.info('User left room', { roomId, username: user?.username, socketId: socket.id });
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: user?.username,
      });
      socket.to(roomId).emit(ACTIONS.VIDEO_LEAVE, { socketId: socket.id });
      await removeUserFromRoom(roomId, user?.userId, socket.id);

      // Give user a 5-minute grace window to rejoin before clearing their active room
      if (user?.userId) {
        const currentActive = await redis.get(`user:${user.userId}:activeRoom`);
        if (currentActive === roomId) await redis.expire(`user:${user.userId}:activeRoom`, 5 * 60);
      }

      // When room is empty, keep keys alive for 5 minutes so users can rejoin
      const remaining = await getAllConnectedClients(roomId);
      if (remaining.length === 0) {
        const TTL = 5 * 60; // 5 minutes
        await redis.expire(`room:${roomId}:users`, TTL);
        await redis.expire(`room:${roomId}:problemId`, TTL);
        await redis.expire(`room:${roomId}:updates`, TTL);
        await redis.expire(`room:${roomId}:creator`, TTL);
      }
    }
  });
});

// ---------------------
// Start
// ---------------------
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  logger.info(`Running on port ${PORT}`);
  logger.info(`Bull Board: http://localhost:${PORT}/admin/queues`);

  startResultWorker(io);
  startAIWorker(io);
});
