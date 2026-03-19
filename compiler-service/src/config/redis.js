const Redis = require('ioredis');

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // required for BullMQ
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

module.exports = redisConnection;
