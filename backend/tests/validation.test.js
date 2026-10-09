import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { clearDatabase, closeDatabase } from './helper.js';

describe('Validation and Error Handling (FR-09)', () => {
  let token;

  beforeEach(async () => {
    await clearDatabase();
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Validator Tester',
      email: 'validator@example.com',
      password: 'Password123!',
    });
    token = reg.body.data.token;
  });

  afterAll(async () => {
    await clearDatabase();
  });

  it('rejects task creation with missing title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Missing title',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('details');
  });

  it('rejects invalid status values with 400 and clear error message', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid Status Test',
        status: 'archived',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body.error.details)).toContain("Status must be 'pending', 'in_progress', or 'completed'");
  });

  it('rejects invalid priority values with 400', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid Priority Test',
        priority: 'urgent',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body.error.details)).toContain("Priority must be 'low', 'medium', or 'high'");
  });

  it('rejects non-UUID task ID in URL parameter', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty PATCH update body with 400', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task to update' });
    const taskId = created.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 with structured error for undefined route', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
