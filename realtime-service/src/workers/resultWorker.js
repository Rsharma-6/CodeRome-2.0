const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const axios = require('axios');
const logger = require('../config/logger');

const STORAGE_URL = () => process.env.STORAGE_SERVICE_URL || 'http://localhost:5002';

// io is passed in from index.js so the worker can emit via Socket.IO
function startResultWorker(io) {
  const worker = new Worker(
    'ResultQueue',
    async (job) => {
      const { type, roomId, submissionId, userId, problemId, payload } = job.data;

      if (type === 'compile') {
        // Broadcast compilation result to all room users
        io.to(roomId).emit('sync-output', {
          output: payload.output || payload.error || '',
          language: payload.language,
          triggeredBy: null,
          time: payload.time,
          error: payload.error,
        });
      } else if (type === 'submission') {
        // Update submission in storage
        if (submissionId) {
          await axios.patch(`${STORAGE_URL()}/submissions/${submissionId}`, {
            status: payload.status,
            results: payload.results,
          }).catch(err => logger.error('Failed to update submission', { submissionId, error: err.message }));
        }

        // If ACCEPTED, update user progress for all logged-in room users
        if (payload.status === 'ACCEPTED' && userId && problemId) {
          // Get problem difficulty for progress tracking
          try {
            const { data: problem } = await axios.get(`${STORAGE_URL()}/problems/${problemId}`);
            await axios.post(`${STORAGE_URL()}/users/${userId}/progress/solved`, {
              problemId,
              difficulty: problem.difficulty,
            });
          } catch (err) {
            logger.error('Failed to update progress', { userId, problemId, error: err.message });
          }
        }

        // Broadcast verdict to ALL room users (everyone sees the result)
        io.to(roomId).emit('quest:result', {
          submissionId,
          status: payload.status,
          results: payload.results,
          language: payload.language,
        });
      }
    },
    { connection: redisConnection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('ResultWorker started');
  return worker;
}

module.exports = startResultWorker;
