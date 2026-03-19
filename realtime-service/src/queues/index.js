const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const ResultQueue = new Queue('ResultQueue', { connection: redisConnection });
const AIQueue = new Queue('AIQueue', { connection: redisConnection });

module.exports = { ResultQueue, AIQueue };
