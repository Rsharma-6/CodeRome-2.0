const { v4: uuidv4 } = require('uuid');
const { CompilationQueue, SubmissionQueue, AIQueue } = require('../queues/index');

async function enqueueCompilation({ roomId, code, language, stdin }) {
  const jobId = uuidv4();
  await CompilationQueue.add('CompilationJob', { jobId, roomId, code, language, stdin });
  console.log(`[Producer] Enqueued CompilationJob ${jobId} for room ${roomId}`);
  return jobId;
}

async function enqueueSubmission({ userId, roomId, problemId, code, language, testCases, driverCode }) {
  await SubmissionQueue.add('SubmissionJob', {
    userId, roomId, problemId, code, language, testCases, driverCode,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
  console.log(`[Producer] Enqueued SubmissionJob for room ${roomId}`);
}

async function enqueueAI({ roomId, type, problemId, code, language, hintNumber, messages, priority = 2 }) {
  await AIQueue.add('AIJob', {
    roomId, type, problemId, code, language, hintNumber, messages,
  }, { priority });
  console.log(`[Producer] Enqueued AIJob type=${type} for room ${roomId}`);
}

module.exports = { enqueueCompilation, enqueueSubmission, enqueueAI };
