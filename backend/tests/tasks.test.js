import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { clearDatabase, closeDatabase } from './helper.js';

describe('Tasks CRUD and Filtering (FR-03, FR-04, FR-05, FR-06, FR-07)', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await clearDatabase();
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Task Tester',
      email: 'tester@example.com',
      password: 'Password123!',
    });
    token = reg.body.data.token;
    userId = reg.body.data.user.id;
  });

  afterAll(async () => {
    await clearDatabase();
  });

  it('POST /api/v1/tasks creates a task with default status and priority', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Learn AWS VPC',
        description: 'Understand subnets and route tables',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Learn AWS VPC',
      description: 'Understand subnets and route tables',
      status: 'pending',
      priority: 'medium',
      userId,
    });
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('createdAt');
    expect(res.body.data).toHaveProperty('updatedAt');
  });

  it('POST /api/v1/tasks creates a task with custom status and priority', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Deploy to RDS',
        description: 'Multi-AZ PostgreSQL instance',
        status: 'in_progress',
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.priority).toBe('high');
  });

  it('GET /api/v1/tasks lists the user tasks in reverse chronological order', async () => {
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task 1' });

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task 2' });

    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].title).toBe('Task 2');
    expect(res.body.data[1].title).toBe('Task 1');
  });

  it('GET /api/v1/tasks filters by status and priority', async () => {
    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task A', status: 'pending', priority: 'low' });

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task B', status: 'completed', priority: 'high' });

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task C', status: 'completed', priority: 'low' });

    const statusFilterRes = await request(app)
      .get('/api/v1/tasks?status=completed')
      .set('Authorization', `Bearer ${token}`);
    expect(statusFilterRes.body.data).toHaveLength(2);

    const priorityFilterRes = await request(app)
      .get('/api/v1/tasks?priority=high')
      .set('Authorization', `Bearer ${token}`);
    expect(priorityFilterRes.body.data).toHaveLength(1);
    expect(priorityFilterRes.body.data[0].title).toBe('Task B');

    const multiFilterRes = await request(app)
      .get('/api/v1/tasks?status=completed&priority=low')
      .set('Authorization', `Bearer ${token}`);
    expect(multiFilterRes.body.data).toHaveLength(1);
    expect(multiFilterRes.body.data[0].title).toBe('Task C');
  });

  it('GET /api/v1/tasks/:id retrieves a single owned task', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Single Task' });
    const taskId = created.body.data.id;

    const res = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(taskId);
    expect(res.body.data.title).toBe('Single Task');
  });

  it('PATCH /api/v1/tasks/:id partially updates task details', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old Title', status: 'pending' });
    const taskId = created.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title',
        status: 'completed',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
    expect(res.body.data.status).toBe('completed');
  });

  it('DELETE /api/v1/tasks/:id removes an owned task', async () => {
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete' });
    const taskId = created.body.data.id;

    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});
