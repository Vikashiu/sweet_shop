import express from 'express';
import { prismaClient } from '../db';
import { sweetSchema , sweetUpdateSchema} from '../types/sweetTypes';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';


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

// GET /api/sweets/search → search by name/category/price range
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const name = typeof req.query.name === 'string' ? req.query.name.trim() : undefined;
        const category = typeof req.query.category === 'string' ? req.query.category.trim() : undefined;
        const minPriceStr = typeof req.query.minPrice === 'string' ? req.query.minPrice : undefined;
        const maxPriceStr = typeof req.query.maxPrice === 'string' ? req.query.maxPrice : undefined;


        const minPrice = minPriceStr !== undefined ? Number(minPriceStr) : undefined;
        const maxPrice = maxPriceStr !== undefined ? Number(maxPriceStr) : undefined;


        // Validate numbers if provided
        if ((minPriceStr !== undefined && Number.isNaN(minPrice)) || (maxPriceStr !== undefined && Number.isNaN(maxPrice))) {
            return res.status(411).json({ message: 'incorrect inputs' });
        }


        if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
            return res.status(411).json({ message: 'incorrect inputs' });
        }


        const clauses: any[] = [];
        if (name) clauses.push({ name: { contains: name, mode: 'insensitive' as const } });
        if (category) clauses.push({ category: { equals: category, mode: 'insensitive' as const } });
        if (minPrice !== undefined || maxPrice !== undefined) {
            clauses.push({ price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } });
        }

        let where: any | undefined;
        if (clauses.length === 1) where = clauses[0];
        else if (clauses.length > 1) where = { AND: clauses };


        const sweets = await prismaClient.sweet.findMany(where ? { where } : {});
        return res.status(200).json(sweets);
    } catch (err) {
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const parsed = sweetUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(411).json({ message: "incorrect inputs" });
  }

  try {
    const updated = await prismaClient.sweet.update({
      where: { id },
      data: parsed.data,
    });
    return res.status(200).json(updated);
  } catch (err: any) {
    // Prisma not found
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "sweet not found" });
    }
    return res.status(500).json({ message: "internal server error" });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ message: "forbidden" });
  }

  try {
    await prismaClient.sweet.delete({ where: { id: req.params.id } });
    return res.status(204).send(); // no content
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "sweet not found" });
    }
    return res.status(500).json({ message: "internal server error" });
  }
});


export default router;