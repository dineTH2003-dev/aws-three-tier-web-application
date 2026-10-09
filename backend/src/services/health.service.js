import { db } from '../config/db.js';

export const healthService = {
  checkLiveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  },

  async checkReadiness() {
    try {
      const isDbConnected = await db.ping();
      if (!isDbConnected) {
        return {
          isReady: false,
          details: {
            status: 'degraded',
            database: 'unresponsive',
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        isReady: true,
        details: {
          status: 'ready',
          database: 'connected',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err) {
      return {
        isReady: false,
        details: {
          status: 'down',
          database: 'error',
          message: err.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
};
