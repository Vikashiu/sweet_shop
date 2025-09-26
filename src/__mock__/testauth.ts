// File: src/__mock__/testAuth.ts
// Purpose: tiny helper used ONLY by tests to obtain a valid JWT via the real auth routes
import request from 'supertest';
import app from '../index';
import jwt from 'jsonwebtoken';

const JWT_PASSWORD = process.env.JWT_PASSWORD || 'secret';

export function makeTestToken(payload?: Partial<{ userId: string; role: 'ADMIN' | 'CUSTOMER' }>) {
  const userId =
    payload?.userId ??
    (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `u_${Date.now()}`);
  const role = payload?.role ?? 'ADMIN';
  return jwt.sign({ userId, role }, JWT_PASSWORD);
}

export async function registerAndLogin(role: 'ADMIN' | 'CUSTOMER' = 'ADMIN') {
const unique = Date.now() + Math.floor(Math.random() * 1000);
const email = `tester_${unique}@example.com`;
const password = 'secret12';
const name = 'Test User';


// 1) register (your /register may or may not accept role; if it does not, it will default to CUSTOMER)
await request(app)
.post('/api/auth/register')
.send({ email, password, name, role })
.expect((res) => {
// allow 201 (created) OR 403 (already exists) when re-running tests locally
if (![201, 403].includes(res.status)) {
throw new Error(`Unexpected register status: ${res.status}`);
}
});


// 2) login to get the JWT we will use in sweets tests
const loginRes = await request(app)
.post('/api/auth/login')
.send({ email, password })
.expect(200);


return loginRes.body.token as string;
}


export function buildSweet(overrides: Partial<{ name: string; category: string; price: number; quantity: number }> = {}) {
const n = Math.floor(Math.random() * 1e6);
return {
name: `Gulab Jamun ${n}`,
category: 'Traditional',
price: 120,
quantity: 50,
...overrides,
};
}