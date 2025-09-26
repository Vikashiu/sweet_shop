import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_PASSWORD = process.env.JWT_PASSWORD || "secret"; // same as in authRoutes

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

// Middleware to verify token and attach user info
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_PASSWORD) as { userId: string; role?: string };
    req.userId = decoded.userId;
    req.role = decoded.role || "CUSTOMER";
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
