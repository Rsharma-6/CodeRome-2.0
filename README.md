# CodeRome — AI-Powered Collaborative Problem Solving Platform

Real-time collaborative code editor with Docker-based execution, AI pair programming, WebRTC video, and LeetCode-style problems.

> "Real software engineering is collaborative and AI-assisted. LeetCode is solo. Copilot is individual. CodeRome brings both together — teams solve problems in real-time with a shared AI that facilitates collaboration, not replaces it."

## Architecture

| Service | Port | Purpose |
|---|---|---|
| `frontend` | 5173 | React + Vite + Tailwind UI |
| `api-gateway` | 5000 | JWT auth, routing, Bull MQ producers |
| `compiler-service` | 5001 | Docker-based code execution (16 languages) |
| `storage-service` | 5002 | MongoDB — users, problems, submissions |
| `realtime-service` | 5003 | Socket.IO, AI relay (Claude), WebRTC signaling |

## Quick Start

### Option 1: Docker Compose (recommended)

```bash
# Create .env in root with Claude API key
echo "CLAUDE_API_KEY=your_key_here" > .env

# Start everything
docker-compose up -d

# Seed sample problems
cd scripts && node seed-problems.js
```

### Option 2: Manual (development)

**Prerequisites:** Node.js 18+, Redis, MongoDB, Docker daemon

1. **Install dependencies** in each service:
   ```bash
   cd compiler-service && npm install
   cd api-gateway && npm install
   cd storage-service && npm install
   cd realtime-service && npm install
   cd frontend && npm install
   ```

2. **Copy env files:**
   ```bash
   cp compiler-service/.env.example compiler-service/.env
   cp api-gateway/.env.example api-gateway/.env
   cp storage-service/.env.example storage-service/.env
   cp realtime-service/.env.example realtime-service/.env
   cp frontend/.env.example frontend/.env
   ```

   Edit `realtime-service/.env` → set `CLAUDE_API_KEY`
   Edit `api-gateway/.env` → set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

3. **Start services** (each in its own terminal):
   ```bash
   cd compiler-service && npm run dev    # port 5001
   cd api-gateway && npm run dev         # port 5000
   cd storage-service && npm run dev     # port 5002
   cd realtime-service && npm run dev    # port 5003
   cd frontend && npm run dev            # port 5173
   ```

4. **Seed problems:**
   ```bash
   cd scripts && node seed-problems.js
   ```

5. Open `http://localhost:5173`

### Legacy server (quick start, still works)

The original `server/` still works and now routes compilation to `compiler-service`:
```bash
cd server && npm start
cd frontend && npm run dev
```
The frontend will use `http://localhost:5003` for Socket.IO (realtime-service) automatically.

## Features

### Phase 1 — Own Compiler
- Docker-isolated execution for 16 languages
- 10s timeout, 256MB memory limit, no outbound network
- Bull MQ queues with BullBoard dashboard at each service's `/admin/queues`

### Phase 2 — Auth + Storage
- JWT access tokens (15min, in memory) + refresh tokens (7d, httpOnly cookie)
- Auto-refresh with Axios interceptor — transparent to user
- MongoDB: users, problems, submissions, user progress, chat messages

### Phase 3 — Collaborative Problem Solving
- Problem library with difficulty/tag filters
- "Solve with Team" → creates room pre-loaded with problem
- Submit → evaluate all test cases (including hidden) → verdict broadcast to ALL room users

### Phase 4 — AI as a Team Tool
- **Shared Hints** — streamed to all room users simultaneously
- **Code Review** — auto-triggered after submission
- **Explain to Teammate** — AI bridges skill gap, calibrated for beginners
- **AI Interview Simulator** — both teammates get interviewed together
- **AI Problem Generator** — creates problems with test cases, saves to library

### Phase 5 — Chat + Video
- Persistent room chat with history on join
- WebRTC peer-to-peer video (Google STUN)
- Mic/camera mute controls

## Language Support

| Language | Docker Image |
|---|---|
| python3 | python:3.11-slim |
| java | eclipse-temurin:17-jdk |
| cpp, c | gcc:latest |
| nodejs | node:18-slim |
| go | golang:1.21-alpine |
| ruby | ruby:3.2-slim |
| rust | rust:slim |
| php | php:8.2-cli |
| swift | swift:5.9-slim |
| csharp | mcr.microsoft.com/dotnet/sdk:7.0 |
| scala | sbtscala/scala-sbt |
| r | r-base:4.3.1 |
| bash | bash:5.2 |
| pascal | nickblah/fpc:latest |

> **Java:** Public class must be named `Main`

## Queue Architecture

```
api-gateway (producer)
    ├── CompilationQueue ──► compiler-service worker ──► ResultQueue
    ├── SubmissionQueue  ──► compiler-service worker ──► ResultQueue
    └── AIQueue          ──► realtime-service AI worker
                                         │
                                  ResultQueue consumer
                                         │
                             Socket.IO broadcast to room
```

## Key Environment Variables

| Service | Variable | Description |
|---|---|---|
| api-gateway | `JWT_ACCESS_SECRET` | Secret for 15-min access tokens |
| api-gateway | `JWT_REFRESH_SECRET` | Secret for 7-day refresh tokens |
| realtime-service | `CLAUDE_API_KEY` | Anthropic API key |
| realtime-service | `CLAUDE_MODEL` | Model ID (default: claude-haiku-4-5-20251001) |
