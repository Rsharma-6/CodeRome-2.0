const Redis = require('ioredis');

const redisConnection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

module.exports = redisConnection;
