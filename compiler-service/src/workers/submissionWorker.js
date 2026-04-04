const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const { executeCode } = require('../executors/codeExecutor');
const { ResultQueue } = require('../queues/index');
const logger = require('../config/logger');

function normalizeOutput(s) {
  return (s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function startSubmissionWorker() {
  const worker = new Worker(
    'SubmissionQueue',
    async (job) => {
      const { submissionId, userId, roomId, problemId, code, language, testCases, driverCode } = job.data;
      logger.info('Processing submission', { submissionId, language, roomId, problemId });

      const testResults = [];
      let overallStatus = 'ACCEPTED';

      for (const tc of testCases) {
        const fullCode = driverCode ? `${code}\n\n${driverCode}` : code;
        const result = await executeCode(language, fullCode, tc.input);

        const actualOutput = normalizeOutput(result.output);
        const expectedOutput = normalizeOutput(tc.expectedOutput);
        const passed = result.exitCode === 0 && actualOutput === expectedOutput;

        if (!passed) {
          if (result.error && result.error.includes('Time Limit')) {
            overallStatus = 'TLE';
          } else if (result.error) {
            overallStatus = 'RE'; // Runtime Error
          } else {
            overallStatus = 'WRONG_ANSWER';
          }
        }

        testResults.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: actualOutput,
          passed,
          error: result.error,
          time: result.time,
        });

        // Stop on first failure (can be configured to run all)
        if (!passed) break;
      }

      await ResultQueue.add('ResultJob', {
        type: 'submission',
        roomId,
        userId,
        problemId,
        payload: {
          status: overallStatus,
          results: testResults,
          language,
          code,
        },
      });

      return { submissionId, status: overallStatus };
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.SUBMISSION_CONCURRENCY || '2'),
    }
  );

  worker.on('completed', (job) => {
    logger.info('Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('SubmissionWorker started');
  return worker;
}

module.exports = startSubmissionWorker;
