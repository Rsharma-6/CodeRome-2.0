// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const Redis = require("ioredis");
require("dotenv").config();
const ACTIONS = require("./Actions");

const app = express();
const server = http.createServer(app);

// ---------------------
// Redis Setup
// ---------------------
const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || "",
});

// ---------------------
// Middleware
// ---------------------
app.use(cors());
app.use(express.json());

// ---------------------
// Socket.io Setup
// ---------------------
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// ---------------------
// Compiler Service URL (replaces JDoodle)
// ---------------------
const COMPILER_SERVICE_URL = process.env.COMPILER_SERVICE_URL || "http://localhost:5001";

// ---------------------
// Helper functions
// ---------------------

// Users
async function addUserToRoom(roomId, socketId, username, role = "viewer") {
  await redis.hset(`room:${roomId}:users`, socketId, JSON.stringify({ username, role }));
}

async function removeUserFromRoom(roomId, socketId) {
  await redis.hdel(`room:${roomId}:users`, socketId);
}

async function getAllConnectedClients(roomId) {
  const users = await redis.hgetall(`room:${roomId}:users`);
  return Object.keys(users).map((socketId) => {
    const data = JSON.parse(users[socketId]);
    return { socketId, username: data.username, role: data.role };
  });
}

async function getUserRole(roomId, socketId) {
  const user = await redis.hget(`room:${roomId}:users`, socketId);
  if (!user) return null;
  return JSON.parse(user).role;
}

// Docs
async function saveRoomUpdate(roomId, update) {
  await redis.rpush(`room:${roomId}:updates`, JSON.stringify(update));
}

async function getRoomUpdates(roomId) {
  const updates = await redis.lrange(`room:${roomId}:updates`, 0, -1);
  return updates.map((u) => JSON.parse(u));
}

// ---------------------
// Rate limiter
// ---------------------
const rateLimit = {}; // { socketId: timestamp }

function canRunCode(socketId, limitMs = 5000) {
  const now = Date.now();
  if (rateLimit[socketId] && now - rateLimit[socketId] < limitMs) return false;
  rateLimit[socketId] = now;
  return true;
}

// Optional: cleanup old entries
setInterval(() => {
  const now = Date.now();
  for (const id in rateLimit) {
    if (now - rateLimit[id] > 60000) delete rateLimit[id];
  }
}, 60000);

// ---------------------
// Socket.io Events
// ---------------------
io.on("connection", (socket) => {

  socket.on(ACTIONS.JOIN, async ({ roomId, username, role }) => {
    role = role || "viewer"; // default role
    await addUserToRoom(roomId, socket.id, username, role);
    socket.join(roomId);

    const clients = await getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, async ({ roomId, update }) => {
    const role = await getUserRole(roomId, socket.id);
    if (role !== "editor") return; // only editor can send updates

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
    const role = await getUserRole(roomId, socket.id);
    if (role !== "editor") return;
    socket.to(roomId).emit(ACTIONS.SYNC_OUTPUT, { output, language, triggeredBy });
  });

  socket.on("sync-output-single", ({ socketId, output, language }) => {
    io.to(socketId).emit(ACTIONS.SYNC_OUTPUT, { output, language });
  });

  socket.on("disconnecting", async () => {
    const rooms = [...socket.rooms];
    for (const roomId of rooms) {
      const clients = await getAllConnectedClients(roomId);
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: clients.find(c => c.socketId === socket.id)?.username,
      });

      await removeUserFromRoom(roomId, socket.id);
    }
    socket.leave();
  });
});

// ---------------------
// REST API: Compile (proxies to compiler-service)
// ---------------------
app.post("/compile", async (req, res) => {
  const { code, language, stdin } = req.body;

  const socketId = req.body.socketId;
  if (socketId && !canRunCode(socketId)) {
    return res.status(429).json({ error: "Please wait before running again" });
  }

  try {
    const response = await axios.post(`${COMPILER_SERVICE_URL}/compile`, {
      code,
      language,
      stdin: stdin || "",
    }, { timeout: 15000 });

    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ error: "Compiler service is unavailable. Please ensure compiler-service is running." });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to compile code" });
  }
});

// ---------------------
// Start Server
// ---------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
