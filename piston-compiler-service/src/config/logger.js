const winston = require('winston');

const SERVICE_NAME = 'piston-compiler-service';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${SERVICE_NAME}] ${level}: ${message}${extra}`;
  })
);

const transports = [new winston.transports.Console({ format: consoleFormat })];

if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  const LOG_DIR = path.resolve(__dirname, '../../../../logs');
  const jsonFormat = combine(timestamp(), errors({ stack: true }), winston.format.json());
  transports.push(
    new winston.transports.File({ filename: path.join(LOG_DIR, `${SERVICE_NAME}.log`), format: jsonFormat }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error', format: jsonFormat })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: SERVICE_NAME },
  transports,
});

module.exports = logger;
