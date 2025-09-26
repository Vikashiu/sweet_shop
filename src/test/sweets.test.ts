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

describe('GET /api/sweets — list sweets', () => {
    it('200 → returns an array of sweets', async () => {
        (prismaClient.sweet.findMany as any).mockResolvedValue([
            { id: 's1', name: 'Gulab Jamun', category: 'Traditional', price: 120, quantity: 40 },
            { id: 's2', name: 'Rasgulla', category: 'Traditional', price: 100, quantity: 30 },
        ]);


        const res = await request(app)
            .get('/api/sweets')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);


        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toMatchObject({ id: 's1', name: 'Gulab Jamun' });
        expect(res.body[1]).toMatchObject({ id: 's2', name: 'Rasgulla' });
    });


    it('200 → returns empty array when no sweets exist', async () => {
        (prismaClient.sweet.findMany as any).mockResolvedValue([]);


        const res = await request(app)
            .get('/api/sweets')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);


        expect(res.body).toEqual([]);
    });


    it('401 → rejects when Authorization header is missing', async () => {
        const res = await request(app).get('/api/sweets');
        expect(res.status).toBe(401);
    });


    it('401 → rejects when token is invalid', async () => {
        const res = await request(app)
            .get('/api/sweets')
            .set('Authorization', 'Bearer invalid.token.here');
        expect(res.status).toBe(401);
    });
});


describe('GET /api/sweets/search — query sweets', () => {
    it('200 → filters by name (case-insensitive contains)', async () => {
        (prismaClient.sweet.findMany as any).mockResolvedValue([
            { id: 's1', name: 'Kaju Katli', category: 'Traditional', price: 250, quantity: 10 },
        ]);


        const res = await request(app)
            .get('/api/sweets/search?name=kaju')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);


        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Kaju Katli');


        // ensure prisma called with expected where
        expect(prismaClient.sweet.findMany).toHaveBeenCalledWith({
            where: {
                name: { contains: 'kaju', mode: 'insensitive' },
            },
        });
    });


    it('200 → filters by category', async () => {
        (prismaClient.sweet.findMany as any).mockResolvedValue([
            { id: 's2', name: 'Baklava', category: 'Greek', price: 400, quantity: 5 },
        ]);


        const res = await request(app)
            .get('/api/sweets/search?category=Greek')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);


        expect(res.body.length).toBe(1);
        expect(res.body[0].category).toBe('Greek');
        expect(prismaClient.sweet.findMany).toHaveBeenCalledWith({
            where: {
                category: { equals: 'Greek', mode: 'insensitive' },
            },
        });
    });
    it('200 → filters by price range (minPrice, maxPrice)', async () => {
        (prismaClient.sweet.findMany as any).mockResolvedValue([
            { id: 's3', name: 'Rasgulla', category: 'Traditional', price: 100, quantity: 30 },
            { id: 's4', name: 'Soan Papdi', category: 'Traditional', price: 120, quantity: 20 },
        ]);


        const res = await request(app)
            .get('/api/sweets/search?minPrice=90&maxPrice=130')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);


        expect(res.body.length).toBe(2);
        expect(prismaClient.sweet.findMany).toHaveBeenCalledWith({
            where: {
                price: { gte: 90, lte: 130 },
            },
        });
    });


    it('200 → can combine filters', async () => {
        (prismaClient.sweet.findMany as any).mockResolvedValue([
            { id: 's5', name: 'Dark Chocolate Barfi', category: 'Fusion', price: 300, quantity: 12 },
        ]);


        const res = await request(app)
            .get('/api/sweets/search?name=choco&category=Fusion&minPrice=250&maxPrice=350')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);


        expect(res.body.length).toBe(1);
        expect(prismaClient.sweet.findMany).toHaveBeenCalledWith({
            where: {
                AND: [
                    { name: { contains: 'choco', mode: 'insensitive' } },
                    { category: { equals: 'Fusion', mode: 'insensitive' } },
                    { price: { gte: 250, lte: 350 } },
                ],
            },
        });
    });


    it('411 → validation error when minPrice > maxPrice', async () => {
        const res = await request(app)
            .get('/api/sweets/search?minPrice=200&maxPrice=100')
            .set('Authorization', `Bearer ${token}`);


        expect(res.status).toBe(411);
        expect(res.body).toHaveProperty('message');
    });


    it('401 → rejects when Authorization header is missing', async () => {
        const res = await request(app).get('/api/sweets/search?name=a');
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/sweets/:id — update sweet', () => {
    it('200 → updates allowed fields (e.g., name and price)', async () => {
        const id = 's1';
        const body = { name: 'Kaju Katli Premium', price: 275 };


        (prismaClient.sweet.update as any).mockResolvedValue({
            id,
            name: body.name,
            category: 'Traditional',
            price: body.price,
            quantity: 10,
        });


        const res = await request(app)
            .put(`/api/sweets/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(body)
            .expect(200);


        expect(res.body).toMatchObject({ id, name: body.name, price: body.price });
        expect(prismaClient.sweet.update).toHaveBeenCalledWith({
            where: { id },
            data: body,
        });
    });


    it('411 → validation error on bad input (negative price / empty name)', async () => {
        const id = 's2';
        const res = await request(app)
            .put(`/api/sweets/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ price: -10 })
            .expect(411);


        expect(res.body).toHaveProperty('message');
    });
    it('404 → when sweet not found', async () => {
        const id = 'missing-id';


        // Simulate Prisma P2025 (record not found)
        const err: any = new Error('No record found');
        err.code = 'P2025';
        (prismaClient.sweet.update as any).mockRejectedValueOnce(err);


        const res = await request(app)
            .put(`/api/sweets/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'NewName' })
            .expect(404);


        expect(res.body).toHaveProperty('message');
    });


    it('401 → rejects when Authorization header is missing', async () => {
        const res = await request(app).put('/api/sweets/s1').send({ name: 'X' });
        expect(res.status).toBe(401);
    });


    it('401 → rejects when token is invalid', async () => {
        const res = await request(app)
            .put('/api/sweets/s1')
            .set('Authorization', 'Bearer invalid.token')
            .send({ name: 'X' });
        expect(res.status).toBe(401);
    });
});

let adminToken: string;
let userToken: string;


beforeAll(() => {
adminToken = makeTestToken({ role: 'ADMIN' });
userToken = makeTestToken({ role: 'CUSTOMER' });
});

describe('DELETE /api/sweets/:id — admin only', () => {
it('204 → deletes a sweet when admin', async () => {
const id = 's-del-1';


// prisma delete returns deleted object; we return 204 no body
(prismaClient.sweet.delete as any).mockResolvedValue({ id });


const res = await request(app)
.delete(`/api/sweets/${id}`)
.set('Authorization', `Bearer ${adminToken}`)
.expect([200, 204]);


// Some codebases return 200 with deleted entity; we accept 200 or 204
expect(prismaClient.sweet.delete).toHaveBeenCalledWith({ where: { id } });
});


it('403 → rejects non-admin user', async () => {
const res = await request(app)
.delete('/api/sweets/any')
.set('Authorization', `Bearer ${userToken}`);


expect(res.status).toBe(403);
});


it('404 → when sweet not found', async () => {
const id = 'missing-id';
const err: any = new Error('No record found');
err.code = 'P2025';
(prismaClient.sweet.delete as any).mockRejectedValueOnce(err);


const res = await request(app)
.delete(`/api/sweets/${id}`)
.set('Authorization', `Bearer ${adminToken}`)
.expect(404);


expect(res.body).toHaveProperty('message');
});


it('401 → rejects when Authorization header is missing', async () => {
const res = await request(app).delete('/api/sweets/xyz');
expect(res.status).toBe(401);
});


it('401 → rejects when token is invalid', async () => {
const res = await request(app)
.delete('/api/sweets/xyz')
.set('Authorization', 'Bearer invalid.token');
expect(res.status).toBe(401);
});
});