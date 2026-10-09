import { z } from 'zod';

const TaskStatus = z.enum(['pending', 'in_progress', 'completed'], {
  errorMap: () => ({ message: "Status must be 'pending', 'in_progress', or 'completed'" }),
});

const TaskPriority = z.enum(['low', 'medium', 'high'], {
  errorMap: () => ({ message: "Priority must be 'low', 'medium', or 'high'" }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z.string().trim().max(5000).optional().nullable(),
    status: TaskStatus.optional().default('pending'),
    priority: TaskPriority.optional().default('medium'),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID format'),
  }),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, 'Title cannot be empty')
        .max(200, 'Title cannot exceed 200 characters')
        .optional(),
      description: z.string().trim().max(5000).nullable().optional(),
      status: TaskStatus.optional(),
      priority: TaskPriority.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const getTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID format'),
  }),
});

export const listTasksSchema = z.object({
  query: z.object({
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
  }),
});
