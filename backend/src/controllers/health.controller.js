import { healthService } from '../services/health.service.js';

export const healthController = {
  live(_req, res) {
    const status = healthService.checkLiveness();
    res.status(200).json(status);
  },

  async ready(_req, res) {
    const { isReady, details } = await healthService.checkReadiness();
    if (isReady) {
      res.status(200).json(details);
    } else {
      res.status(503).json(details);
    }
  },
};
