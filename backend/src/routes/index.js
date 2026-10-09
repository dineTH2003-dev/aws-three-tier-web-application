import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { tasksRouter } from './tasks.routes.js';

export const router = Router();

// Health checks (also mounted at root /health for ALB target health checks)
router.use('/health', healthRouter);

// API v1 endpoints
const v1Router = Router();
v1Router.use('/auth', authRouter);
v1Router.use('/tasks', tasksRouter);

router.use('/api/v1', v1Router);
