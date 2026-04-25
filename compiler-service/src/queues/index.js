const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const CompilationQueue = new Queue('CompilationQueue', { connection: redisConnection });
const SubmissionQueue = new Queue('SubmissionQueue', { connection: redisConnection });
const ResultQueue = new Queue('ResultQueue', { connection: redisConnection });

module.exports = { CompilationQueue, SubmissionQueue, ResultQueue };
