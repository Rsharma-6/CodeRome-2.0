const axios = require('axios');
const logger = require('../config/logger');

const JDOODLE_URL = 'https://api.jdoodle.com/v1/execute';
const JDOODLE_TIMEOUT = 150000;

const LANGUAGE_CONFIG = {
  python3: { language: 'python3',  versionIndex: '4' },
  java:    { language: 'java',     versionIndex: '4' },
  cpp:     { language: 'cpp17',    versionIndex: '1' },
  c:       { language: 'c',        versionIndex: '5' },
  nodejs:  { language: 'nodejs',   versionIndex: '4' },
  ruby:    { language: 'ruby',     versionIndex: '4' },
  go:      { language: 'go',       versionIndex: '4' },
  rust:    { language: 'rust',     versionIndex: '4' },
  php:     { language: 'php',      versionIndex: '4' },
  swift:   { language: 'swift',    versionIndex: '4' },
  csharp:  { language: 'csharp',   versionIndex: '4' },
  scala:   { language: 'scala',    versionIndex: '4' },
  r:       { language: 'r',        versionIndex: '4' },
  bash:    { language: 'bash',     versionIndex: '4' },
  pascal:  { language: 'pascal',   versionIndex: '3' },
};

async function executeCode(language, code, stdin = '') {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return { output: null, error: `Unsupported language: ${language}`, exitCode: 1, time: 0 };
  }

  const startTime = Date.now();
  logger.info('Executing code via JDoodle', { language, jdoodleLang: config.language, stdinLength: stdin?.length, stdinPreview: stdin?.slice(0, 100) });

  try {
    const { data } = await axios.post(
      JDOODLE_URL,
      {
        clientId:     process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script:       code,
        language:     config.language,
        versionIndex: config.versionIndex,
        stdin:        stdin || '',
      },
      { timeout: JDOODLE_TIMEOUT }
    );

    const elapsed = Date.now() - startTime;
    logger.debug('JDoodle raw response', { statusCode: data.statusCode, output: data.output, cpuTime: data.cpuTime, memory: data.memory });

    if (data.statusCode !== 200) {
      return { output: '', error: data.output || 'JDoodle execution failed', exitCode: 1, time: elapsed };
    }

    const output = data.output || '';

    if (output.includes('Time Limit Exceeded')) {
      return { output: '', error: 'Time Limit Exceeded', exitCode: -1, time: elapsed };
    }

    // JDoodle returns runtime errors inside output with statusCode 200
    const runtimeErrorPatterns = [
      /^Traceback \(most recent call last\)/m,
      /^Exception in thread/m,
      /^error:/m,
      /^fatal error:/m,
      /^\S+Error:/m,
      /^panic:/m,
    ];

    if (runtimeErrorPatterns.some(p => p.test(output))) {
      return { output: '', error: output, exitCode: 1, time: elapsed };
    }

    return { output, error: null, exitCode: 0, time: elapsed };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    logger.error('JDoodle API error', { language, error: err.message });

    if (err.code === 'ECONNABORTED') {
      return { output: '', error: 'Execution timed out', exitCode: -1, time: elapsed };
    }
    if (err.response?.status === 401) {
      return { output: '', error: 'Compiler service authentication failed', exitCode: -1, time: elapsed };
    }
    return { output: '', error: `Execution service error: ${err.message}`, exitCode: -1, time: elapsed };
  }
}

module.exports = { executeCode };
