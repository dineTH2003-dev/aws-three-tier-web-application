import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './config/db.js';

const server = app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port} in [${config.env}] mode`);
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await pool.end();
      logger.info('Database connection pool drained and closed.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error closing database pool during shutdown');
      process.exit(1);
    }
  });

  // Force shutdown if taking too long
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
