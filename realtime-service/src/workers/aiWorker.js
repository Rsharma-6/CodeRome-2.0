const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const axios = require('axios');
const { streamResponse, buildMessages } = require('../ai/claudeClient');
const logger = require('../config/logger');

const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

// io is passed in from index.js
function startAIWorker(io) {
  const worker = new Worker(
    'AIQueue',
    async (job) => {
      const { roomId, type, problemId, code, language, hintNumber, messages: conversationHistory } = job.data;

      // Broadcast to room that AI is starting
      io.to(roomId).emit('ai:stream', { token: '', start: true, type });

      let problem = null;
      if (problemId) {
        try {
          const { data } = await axios.get(`${STORAGE_URL()}/problems/${problemId}`);
          problem = data;
        } catch {
          // proceed without problem context
        }
      }

      const contextMessages = buildMessages({
        type,
        problem,
        code,
        language,
        hintNumber,
        conversationHistory,
      });

      let fullResponse = '';

      await streamResponse(
        type,
        contextMessages,
        // onToken: broadcast each token to room
        (token) => {
          fullResponse += token;
          io.to(roomId).emit('ai:stream', { token, type });
        },
        // onDone
        () => {
          io.to(roomId).emit('ai:done', { type, response: fullResponse });
        },
        // onError
        (err) => {
          logger.error('Claude API error', { roomId, type, error: err.message });
          io.to(roomId).emit('ai:error', { error: 'AI service error. Please try again.' });
        }
      );

      // For 'generate' type, try to parse and save the problem
      if (type === 'generate') {
        try {
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const generatedProblem = JSON.parse(jsonMatch[0]);
            const { data: saved } = await axios.post(`${STORAGE_URL()}/problems`, {
              ...generatedProblem,
              isAIGenerated: true,
            });
            io.to(roomId).emit('ai:problem-generated', { problem: saved });
          }
        } catch {
          // parse failure is non-critical
        }
      }
    },
    { connection: redisConnection, concurrency: 2 }
  );

  worker.on('failed', (job, err) => {
    const roomId = job?.data?.roomId;
    logger.error('Job failed', { jobId: job?.id, roomId, error: err.message });
    if (roomId) {
      io.to(roomId).emit('ai:error', { error: 'AI request failed. Please try again.' });
    }
  });

  logger.info('AIWorker started');
  return worker;
}

module.exports = startAIWorker;
