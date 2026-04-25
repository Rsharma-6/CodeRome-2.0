const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createContainer } = require('../containers/containerFactory');
const pullImage = require('../containers/pullImage');
const decodeDockerStream = require('../containers/dockerHelper');
const { LANGUAGE_CONFIG } = require('./languageConfig');
const logger = require('../config/logger');

const TEMP_BASE = '/tmp/coderomes';
const TIMEOUT_MS = 10000; // 10 second execution limit

async function executeCode(language, code, stdin = '') {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return { output: null, error: `Unsupported language: ${language}`, exitCode: 1, time: 0 };
  }

  const jobId = uuidv4();
  const tempDir = path.join(TEMP_BASE, jobId);
  let container = null;
  const startTime = Date.now();

  logger.info('Executing code', { jobId, language });

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(path.join(tempDir, config.filename), code);
    await fs.writeFile(path.join(tempDir, 'input.txt'), stdin || '');

    await pullImage(config.image);

    container = await createContainer(config.image, config.cmd, tempDir);
    await container.start();

    const rawBuffers = [];
    const logStream = await container.logs({ stdout: true, stderr: true, follow: true });
    logStream.on('data', chunk => rawBuffers.push(chunk));

    let timedOut = false;
    const timeoutHandle = setTimeout(async () => {
      timedOut = true;
      await container.kill().catch(() => {});
    }, TIMEOUT_MS);

    await new Promise((resolve, reject) => {
      logStream.on('end', resolve);
      logStream.on('error', reject);
    });
    clearTimeout(timeoutHandle);

    const elapsed = Date.now() - startTime;
    const completeBuffer = Buffer.concat(rawBuffers);
    const { stdout, stderr } = decodeDockerStream(completeBuffer);

    if (timedOut) {
      logger.warn('Time limit exceeded', { jobId, language, elapsed });
      return { output: '', error: 'Time Limit Exceeded (10s)', exitCode: -1, time: elapsed };
    }

    // If there's stderr but also stdout, include both (e.g. compilation warnings + output)
    return {
      output: stdout || '',
      error: stderr || null,
      exitCode: stderr && !stdout ? 1 : 0,
      time: elapsed,
    };
  } catch (err) {
    logger.error('Execution error', { jobId, language, error: err.message });
    return { output: '', error: err.message, exitCode: -1, time: Date.now() - startTime };
  } finally {
    if (container) {
      await container.remove({ force: true }).catch(() => {});
    }
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = { executeCode };
