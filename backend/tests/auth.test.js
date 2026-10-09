import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { clearDatabase, closeDatabase } from './helper.js';

describe('Authentication (FR-01, FR-02)', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user and returns token without password hash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toMatchObject({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('rejects duplicate email registrations with 409 Conflict', async () => {
      await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Another Jane',
        email: 'JANE@example.com', // Case insensitivity test
        password: 'DifferentPassword123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });
    });

    it('authenticates user with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'jane@example.com');
    });

    it('rejects login with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects login for non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns current user profile with valid token', async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });
      const token = reg.body.data.token;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Jane Doe');
      expect(res.body.data).toHaveProperty('email', 'jane@example.com');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });
  });
});
