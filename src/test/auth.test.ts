// IMPORTANT: mock BEFORE importing app so the router picks up the mocks
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../db', () => {
  return {
    prismaClient: {
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    },
  } as const;
});

vi.mock('jsonwebtoken', () => {
  return {
    sign: vi.fn(() => 'mock.jwt.token'),
  } as const;
});

// Now import app (after mocks)
import { app }from '..';
import request from 'supertest';
import { prismaClient } from '../db';
import * as jwt from 'jsonwebtoken';

const REGISTER_URL = '/api/auth/register';
const LOGIN_URL = '/api/auth/login';

beforeEach(() => {
  vi.clearAllMocks();
  // also reset mock implementations between tests for safety
  (prismaClient.user.findFirst as any).mockReset?.();
  (prismaClient.user.create as any).mockReset?.();
  (jwt.sign as any).mockReset?.();
});

// ---------------- Register ----------------
describe('POST /api/auth/register', () => {
  it('201 → registers a new user and returns token', async () => {
    (prismaClient.user.findFirst as any).mockResolvedValue(null);
    (prismaClient.user.create as any).mockResolvedValue({
      id: 'u_1', email: 'alice@example.com', name: 'Alice', password: 'hashed',
    });

    const res = await request(app)
      .post(REGISTER_URL)
      .send({ email: 'alice@example.com', password: '12345678', name: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token', 'mock.jwt.token');
    expect(prismaClient.user.findFirst).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
    expect(prismaClient.user.create).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalledWith({ userId: 'u_1' }, expect.any(String));
  });

  it('403 → if user already exists', async () => {
    (prismaClient.user.findFirst as any).mockResolvedValue({ id: 'u_1' });

    const res = await request(app)
      .post(REGISTER_URL)
      .send({ email: 'alice@example.com', password: '12345678', name: 'Alice' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'user already exists' });
    expect(prismaClient.user.create).not.toHaveBeenCalled();
  });

  it('411 → bad input (fails zod validation)', async () => {
    const res = await request(app)
      .post(REGISTER_URL)
      .send({ email: 'bad-email', password: '123', name: '' });

    expect(res.status).toBe(411);
    expect(res.body).toEqual({ message: 'incorrect inputs' });
  });
});

// ---------------- Login ----------------
describe('POST /api/auth/login', () => {
  it('200 → returns token when credentials are valid', async () => {
    (prismaClient.user.findFirst as any).mockResolvedValue({
      id: 'u_1', email: 'alice@example.com', name: 'Alice', password: '12345678',
    });

    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: 'alice@example.com', password: '12345678' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'mock.jwt.token');
    expect(jwt.sign).toHaveBeenCalledWith({ userId: 'u_1' }, expect.any(String));
  });

  it('403 → invalid credentials (no user)', async () => {
    (prismaClient.user.findFirst as any).mockResolvedValue(null);

    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: 'alice@example.com', password: 'wrong' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'invalid credentials' });
  });

  it('403 → invalid credentials (password mismatch)', async () => {
    (prismaClient.user.findFirst as any).mockResolvedValue({
      id: 'u_1', email: 'alice@example.com', name: 'Alice', password: 'correct',
    });

    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: 'alice@example.com', password: 'wrong' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'invalid credentials' });
  });

  it('411 → bad input (fails zod validation)', async () => {
    const res = await request(app)
      .post(LOGIN_URL)
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(411);
    expect(res.body).toEqual({ message: 'incorrect inputs' });
  });
});
