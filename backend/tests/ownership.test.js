import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { clearDatabase, closeDatabase } from './helper.js';

describe('Cross-User Data Isolation & Ownership', () => {
  let userAToken;
  let userBToken;
  let userATaskId;

  beforeEach(async () => {
    await clearDatabase();

    // Register User A
    const userA = await request(app).post('/api/v1/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'Password123!',
    });
    userAToken = userA.body.data.token;

    // Register User B
    const userB = await request(app).post('/api/v1/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123!',
    });
    userBToken = userB.body.data.token;

    // User A creates a task
    const taskA = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: "User A's Secret Task",
        description: 'Should not be accessible by User B',
      });
    userATaskId = taskA.body.data.id;
  });

  afterAll(async () => {
    await clearDatabase();
  });

  it("User B cannot view User A's task in their task list", async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("User B receives 404 Not Found when trying to view User A's task by ID", async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it("User B receives 404 Not Found when attempting to update User A's task", async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Tampered by User B',
      });

    expect(res.status).toBe(404);

    // Verify task was not modified
    const checkRes = await request(app)
      .get(`/api/v1/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(checkRes.body.data.title).toBe("User A's Secret Task");
  });

  it("User B receives 404 Not Found when attempting to delete User A's task", async () => {
    const res = await request(app)
      .delete(`/api/v1/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);

    // Verify task still exists for User A
    const checkRes = await request(app)
      .get(`/api/v1/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.id).toBe(userATaskId);
  });
});
