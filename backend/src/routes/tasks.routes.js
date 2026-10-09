import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  listTasksSchema,
} from '../validators/task.validator.js';

export const tasksRouter = Router();

tasksRouter.use(authenticate);

tasksRouter.post('/', validate(createTaskSchema), tasksController.create);
tasksRouter.get('/', validate(listTasksSchema), tasksController.list);
tasksRouter.get('/:id', validate(getTaskSchema), tasksController.getById);
tasksRouter.patch('/:id', validate(updateTaskSchema), tasksController.update);
tasksRouter.delete('/:id', validate(getTaskSchema), tasksController.delete);
