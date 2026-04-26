function createBullMQConnection() {
  const Redis = require('ioredis');
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL is required');
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

module.exports = { createBullMQConnection };
