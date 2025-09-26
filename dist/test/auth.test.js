"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const __1 = require("..");
const db_1 = require("../__mock__/db");
vitest_1.vi.mock('../db');
(0, vitest_1.describe)("Auth routes", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.it)("registers a new user successfully", async () => {
        // 1. prisma should say no user exists
        db_1.prismaMock.user.findFirst.mockResolvedValue(null);
        // 2. prisma should create user
        db_1.prismaMock.user.create.mockResolvedValue({
            id: "user-123",
            email: "test@example.com",
            password: "@12Hhashedpw",
            name: "Test",
            role: "CUSTOMER",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const res = await (0, supertest_1.default)(__1.app)
            .post("/api/auth/register/")
            .send({ email: "test@example.com", password: "@!12Hsecretpw", name: "Test" });
        // expect(res.status).toBe(201);
        (0, vitest_1.expect)(res.body).toHaveProperty("token");
    });
    // it("fails register if user exists", async () => {
    //   prismaMock.user.findFirst.mockResolvedValue({ id: "u1" } as any);
    //   const res = await request(app)
    //     .post("/api/auth/register")
    //     .send({ email: "dupe@example.com", password: "@!12Hsecretpw", name: "Dupe" });
    //   expect(res.status).toBe(500);
    //   expect(res.body.message).toBe("user already exists");
    // });
    //   it("logs in successfully", async () => {
    //     prismaMock.user.findFirst.mockResolvedValue({
    //       id: "user-123",
    //       email: "login@example.com",
    //       password: "@!12Hsecretpw",
    //       name: "Login",
    //       role: "CUSTOMER",
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //     } as any);
    //     const res = await request(app)
    //       .post("/api/auth/login")
    //       .send({ email: "login@example.com", password: "@!12Hsecretpw" });
    //     expect(res.status).toBe(200);
    //     expect(res.body).toHaveProperty("token");
    //   });
    //   it("fails login with wrong credentials", async () => {
    //     prismaMock.user.findFirst.mockResolvedValue(null);
    //     const res = await request(app)
    //       .post("/api/auth/login")
    //       .send({ email: "bad@example.com", password: "wrong" });
    //     expect(res.status).toBe(403);
    //     expect(res.body.message).toBe("user doesn't exist");
    //   });
});
//# sourceMappingURL=auth.test.js.map