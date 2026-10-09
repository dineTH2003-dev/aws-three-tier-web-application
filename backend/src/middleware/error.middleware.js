import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  const requestId = req.id || req.headers['x-request-id'] || 'unknown';

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced resource does not exist';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON request body';
  }

  // Structured logging
  if (statusCode >= 500) {
    logger.error({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      code,
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      code,
      message: err.message,
      details,
    });
  }

  const response = {
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  if (config.env === 'development' && statusCode >= 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
