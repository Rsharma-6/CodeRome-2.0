const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const { executeCode } = require('../executors/codeExecutor');
const { ResultQueue } = require('../queues/index');
const logger = require('../config/logger');

function startCompilationWorker() {
  const worker = new Worker(
    'CompilationQueue',
    async (job) => {
      const { jobId, roomId, code, language, stdin } = job.data;
      logger.info('Processing job', { jobId, roomId, language });

      const result = await executeCode(language, code, stdin || '');

      await ResultQueue.add('ResultJob', {
        type: 'compile',
        roomId,
        jobId,
        payload: {
          output: result.output,
          error: result.error,
          exitCode: result.exitCode,
          time: result.time,
          language,
        },
      });

      return result;
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.COMPILER_CONCURRENCY || '3'),
    }
  );

  worker.on('completed', (job) => {
    logger.info('Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('CompilationWorker started');
  return worker;
}

module.exports = startCompilationWorker;
