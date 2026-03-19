const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const CompilationQueue = new Queue('CompilationQueue', { connection: redisConnection });
const SubmissionQueue = new Queue('SubmissionQueue', { connection: redisConnection });
const AIQueue = new Queue('AIQueue', { connection: redisConnection });

module.exports = { CompilationQueue, SubmissionQueue, AIQueue };
