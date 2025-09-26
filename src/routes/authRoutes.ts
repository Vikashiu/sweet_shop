import { Router } from 'express';
import { z } from 'zod';
import { prismaClient } from '../db';
import * as jwt from 'jsonwebtoken';


export const authRouter = Router();


const signupSchema = z.object({
email: z.string().email(),
password: z.string().min(6),
name: z.string().min(1)
});


const loginSchema = z.object({
email: z.string().email(),
password: z.string().min(1)
});


const JWT_PASSWORD = process.env.JWT_PASSWORD || 'dev-secret';


// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
const parsed = signupSchema.safeParse(req.body);
if (!parsed.success) {
return res.status(411).json({ message: 'incorrect inputs' });
}


const { email, password, name } = parsed.data;


const existing = await prismaClient.user.findFirst({ where: { email } });
if (existing) {
return res.status(403).json({ message: 'user already exists' });
}


const user = await prismaClient.user.create({
data: { email, password, name }
});


const token = jwt.sign({ userId: user.id }, JWT_PASSWORD);
return res.status(201).json({ token });
});


// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
const parsed = loginSchema.safeParse(req.body);
if (!parsed.success) {
return res.status(411).json({ message: 'incorrect inputs' });
}


const { email, password } = parsed.data;
const user = await prismaClient.user.findFirst({ where: { email } });


if (!user || user.password !== password) {
return res.status(403).json({ message: 'invalid credentials' });
}

const token = jwt.sign({ userId: user.id }, JWT_PASSWORD);
return res.status(200).json({ token });

});