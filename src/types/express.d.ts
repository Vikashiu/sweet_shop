import 'express-serve-static-core';
import type { Role } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { userId: string; role: Role }; // 'ADMIN' | 'CUSTOMER'
  }
}