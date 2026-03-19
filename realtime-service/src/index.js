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
  await redis.hset(`room:${roomId}:users`, socketId, JSON.stringify({ username, userId, role }));
}

async function removeUserFromRoom(roomId, socketId) {
  await redis.hdel(`room:${roomId}:users`, socketId);
}

async function getAllConnectedClients(roomId) {
  const users = await redis.hgetall(`room:${roomId}:users`) || {};
  return Object.keys(users).map((socketId) => {
    const data = JSON.parse(users[socketId]);
    return { socketId, ...data };
  });
}

async function getUserData(roomId, socketId) {
  const user = await redis.hget(`room:${roomId}:users`, socketId);
  return user ? JSON.parse(user) : null;
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
    await addUserToRoom(roomId, socket.id, username, userId || null, role || 'editor');
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
  });

  // --- Kick Member ---
  socket.on(ACTIONS.KICK_MEMBER, async ({ roomId, targetSocketId }) => {
    const creator = await redis.get(`room:${roomId}:creator`);
    if (creator !== socket.id) return;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!targetSocket) return;
    const kickerData = await getUserData(roomId, socket.id);
    const targetData = await getUserData(roomId, targetSocketId);
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
      socket.to(socketId).emit(ACTIONS.CODE_CHANGE, { update });
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
    const userData = await getUserData(roomId, socket.id);
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
      const clients = await getAllConnectedClients(roomId);
      const user = clients.find(c => c.socketId === socket.id);
      logger.info('User left room', { roomId, username: user?.username, socketId: socket.id });
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: user?.username,
      });
      socket.to(roomId).emit(ACTIONS.VIDEO_LEAVE, { socketId: socket.id });
      await removeUserFromRoom(roomId, socket.id);

      // Clean up problemId when room is empty
      const remaining = await getAllConnectedClients(roomId);
      if (remaining.length === 0) {
        await redis.del(`room:${roomId}:problemId`, `room:${roomId}:updates`, `room:${roomId}:creator`);
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
