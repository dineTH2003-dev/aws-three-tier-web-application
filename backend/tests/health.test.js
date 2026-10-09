import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health Checks', () => {
  it('GET /health/live returns 200 with status ok and uptime', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /health/ready returns 200 when database is healthy', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ready');
    expect(res.body).toHaveProperty('database', 'connected');
    expect(res.body).toHaveProperty('timestamp');
  });
});
