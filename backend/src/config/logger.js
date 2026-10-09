import pino from 'pino';
import { config } from './env.js';

const isTest = config.env === 'test' || process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : config.logLevel,
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      'password_hash',
      'token',
      'accessToken',
      'refreshToken',
      '*.password',
      '*.password_hash',
      '*.token',
    ],
    remove: true,
  },
  transport:
    !isTest && config.env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
