const { AIQueue } = require('../queues/index');

async function enqueueAI({ roomId, type, problemId, code, language, hintNumber, messages, priority = 2 }) {
  await AIQueue.add('AIJob', {
    roomId, type, problemId, code, language, hintNumber, messages,
  }, { priority });
  console.log(`[Producer] Enqueued AIJob type=${type} for room ${roomId}`);
}

module.exports = { enqueueAI };
