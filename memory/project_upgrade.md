---
name: CodeRome Major Upgrade
description: Implementation status of the AI-Powered Collaborative Problem Solving Platform upgrade
type: project
---

Full microservices upgrade of CodeRome was implemented. All 5 phases are scaffolded.

**Why:** Transform from a simple real-time editor (JDoodle-based) into a full AI-powered collaborative coding platform. See plan in conversation for full spec.

**How to apply:** When working on CodeRome, be aware of the new 4-service architecture.

## Services Created
- `api-gateway/` (port 5000) — JWT auth + routing + Bull MQ producers
- `compiler-service/` (port 5001) — Docker-based execution, 16 languages
- `storage-service/` (port 5002) — MongoDB: users, problems, submissions, messages
- `realtime-service/` (port 5003) — Socket.IO + Claude AI + WebRTC signaling

## Key Files Modified
- `server/index.js` — JDoodle replaced with compiler-service call
- `frontend/src/App.jsx` — 6 new routes + AuthProvider wrapper
- `frontend/src/index.css` — Bootstrap removed, Tailwind CSS added
- `frontend/src/Actions.jsx` — Added AI, Chat, Video event constants; fixed "conde-change" typo

## Frontend New Pages
- `/` → Landing.jsx (new hero page)
- `/login`, `/register` → auth/Login.jsx, auth/Register.jsx
- `/problems` → Problems/ProblemList.jsx
- `/problems/:id` → Problems/ProblemDetail.jsx
- `/room/:roomId` → EditorPage.jsx (upgraded with problem panel, AI, chat, video)
- `/profile` → Profile.jsx

## Queue Architecture
CompilationQueue + SubmissionQueue → compiler-service workers → ResultQueue → realtime-service → Socket.IO room broadcast
AIQueue → realtime-service AI worker → Claude API streaming → Socket.IO room broadcast

## Status (2026-03-13)
All files written. Still needs:
1. `npm install` in each service directory
2. `.env` files from `.env.example` templates
3. Docker daemon running for compiler-service
4. MongoDB + Redis running
5. `node scripts/seed-problems.js` for sample problems
6. CLAUDE_API_KEY in realtime-service .env for AI features
