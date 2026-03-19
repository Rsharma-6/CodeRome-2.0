const winston = require('winston');
const path = require('path');

const SERVICE_NAME = 'storage-service';
const LOG_DIR = path.resolve(__dirname, '../../../../logs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, service, ...meta }) => {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${SERVICE_NAME}] ${level}: ${message}${extra}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: SERVICE_NAME },
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, `${SERVICE_NAME}.log`),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: jsonFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;
