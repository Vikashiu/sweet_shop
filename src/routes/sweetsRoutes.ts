import express from 'express';
import { prismaClient } from '../db';
import { sweetSchema } from '../types/sweetTypes';
import { authMiddleware } from '../middleware/authMiddleware';


const router = express.Router();


// POST /api/sweets → create a new sweet
router.post('/', authMiddleware, async (req, res) => {
    const parsed = sweetSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({ message: 'incorrect inputs' });
    }


    try {
        const sweet = await prismaClient.sweet.create({ data: parsed.data });
        // tests accept 200 or 201; we'll return 201
        return res.status(201).json(sweet);
    } catch (err) {
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const sweets = await prismaClient.sweet.findMany();
        return res.status(200).json(sweets);
    } catch (err) {
        return res.status(500).json({ message: 'internal server error' });
    }
});



export default router;