import { tasksService } from '../services/tasks.service.js';

export const tasksController = {
  async create(req, res, next) {
    try {
      const task = await tasksService.createTask(req.user.id, req.body);
      res.status(201).json({
        data: task,
      });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const tasks = await tasksService.listTasks(req.user.id, req.query);
      res.status(200).json({
        data: tasks,
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const task = await tasksService.getTask(req.params.id, req.user.id);
      res.status(200).json({
        data: task,
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const updatedTask = await tasksService.updateTask(req.params.id, req.user.id, req.body);
      res.status(200).json({
        data: updatedTask,
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await tasksService.deleteTask(req.params.id, req.user.id);
      res.status(200).json({
        data: { message: 'Task deleted successfully' },
      });
    } catch (err) {
      next(err);
    }
  },
};
