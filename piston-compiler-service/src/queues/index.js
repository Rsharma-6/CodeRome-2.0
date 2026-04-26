const { Queue } = require('bullmq');
const { createBullMQConnection } = require('../config/bullmq');

const CompilationQueue = new Queue('CompilationQueue', { connection: createBullMQConnection() });
const SubmissionQueue  = new Queue('SubmissionQueue',  { connection: createBullMQConnection() });
const ResultQueue      = new Queue('ResultQueue',      { connection: createBullMQConnection() });

module.exports = { CompilationQueue, SubmissionQueue, ResultQueue };
