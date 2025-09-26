// src/test/sweets.test.ts
import { describe, it, beforeAll, expect, vi } from 'vitest';

// IMPORTANT: mock the db module BEFORE importing app
vi.mock('../db', async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  const prisma = mockDeep<any>();
  return { prismaClient: prisma };
});

import request from 'supertest';
import app from '../index';
import { makeTestToken, buildSweet } from '../__mock__/testauth';
import { prismaClient } from '../db';

let token: string;

beforeAll(async () => {
  token = makeTestToken({ role: 'ADMIN' }); // no DB/register call
});

describe('POST /api/sweets', () => {
  it('201 → creates a sweet', async () => {
    const payload = buildSweet();

    // stub prisma to return created object
    (prismaClient.sweet.create as any).mockResolvedValue({
      id: 'test-sweet-id',
      ...payload,
    });

    const res = await request(app)
      .post('/api/sweets')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: payload.name,
      category: payload.category,
      price: payload.price,
      quantity: payload.quantity,
    });
  });

  it('411 → validation error on bad input (missing name / negative price)', async () => {
    const bad = buildSweet({ name: '', price: -5 });

    const res = await request(app)
      .post('/api/sweets')
      .set('Authorization', `Bearer ${token}`)
      .send(bad);

    expect(res.status).toBe(411);
    expect(res.body).toHaveProperty('message');
  });

  it('401 → rejects when Authorization header is missing', async () => {
    const res = await request(app).post('/api/sweets').send(buildSweet());
    expect(res.status).toBe(401);
  });
});
