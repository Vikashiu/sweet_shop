"use strict";
// import { PrismaClient } from "@prisma/client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaClient = exports.prismaMock = void 0;
// import {mockDeep} from 'vitest-mock-extended';
// export const prismaClient = mockDeep<PrismaClient>();
// src/__mocks__/db.ts
const vitest_mock_extended_1 = require("vitest-mock-extended");
// This is the mock version of prismaClient
exports.prismaMock = (0, vitest_mock_extended_1.mockDeep)();
// Export with the same name as in db.ts
exports.prismaClient = exports.prismaMock;
//# sourceMappingURL=db.js.map