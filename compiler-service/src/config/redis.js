const Redis = require('ioredis');

if (!process.env.REDIS_URL) throw new Error('REDIS_URL is required');

const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

module.exports = redisConnection;
