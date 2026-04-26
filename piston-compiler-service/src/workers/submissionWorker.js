const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../config/bullmq');
const { executeCode } = require('../executors/jdoodleExecutor');
const { ResultQueue } = require('../queues/index');
const logger = require('../config/logger');

function normalize(str) {
  return (str || '').replace(/\r\n/g, '\n').trim();
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
        const result   = await executeCode(language, fullCode, tc.input || '');

        const actualOutput   = normalize(result.output);
        const expectedOutput = normalize(tc.expectedOutput);
        const passed         = !result.error && actualOutput === expectedOutput;

        if (!passed) {
          if (result.error && result.error.includes('Time Limit')) {
            overallStatus = 'TLE';
          } else if (result.error) {
            overallStatus = 'RE';
          } else {
            overallStatus = 'WRONG_ANSWER';
          }
        }

        testResults.push({
          input:          tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput,
          passed,
          error:          result.error,
          time:           result.time,
        });

        if (!passed) break;
      }

      await ResultQueue.add('ResultJob', {
        type: 'submission',
        roomId,
        submissionId,
        userId,
        problemId,
        payload: {
          status:   overallStatus,
          results:  testResults,
          language,
        },
      });

      return { submissionId, status: overallStatus };
    },
    {
      connection:  createBullMQConnection(),
      concurrency: parseInt(process.env.SUBMISSION_CONCURRENCY || '2'),
    }
  );

  worker.on('completed', (job) => logger.info('Submission completed', { jobId: job.id }));
  worker.on('failed',    (job, err) => logger.error('Submission failed', { jobId: job?.id, error: err.message }));

  logger.info('SubmissionWorker started');
  return worker;
}

module.exports = startSubmissionWorker;
