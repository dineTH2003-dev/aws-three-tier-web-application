import { tasksRepository } from '../repositories/tasks.repository.js';
import { NotFoundError } from '../utils/errors.js';

export const tasksService = {
  async createTask(userId, data) {
    return tasksRepository.create({
      userId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
    });
  },

  async listTasks(userId, filters) {
    return tasksRepository.findAllByUser(userId, filters);
  },

  async getTask(id, userId) {
    const task = await tasksRepository.findByIdAndUser(id, userId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  },

  async updateTask(id, userId, updates) {
    // Ensure task exists and belongs to the user
    await this.getTask(id, userId);
    return tasksRepository.update(id, userId, updates);
  },

  async deleteTask(id, userId) {
    // Ensure task exists and belongs to the user
    await this.getTask(id, userId);
    return tasksRepository.delete(id, userId);
  },
};
