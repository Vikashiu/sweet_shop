import { describe, it, beforeAll, expect, vi , afterEach} from "vitest";

// Mock Prisma BEFORE importing the app
vi.mock("../db", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  const prisma = mockDeep<any>();
  return { prismaClient: prisma };
});

import request from "supertest";
import app from "../index";
import { makeTestToken } from "../__mock__/testauth";
import { prismaClient } from "../db";

let userToken: string;
let adminToken: string;

beforeAll(() => {
  adminToken = makeTestToken({ role: "ADMIN" });
  // userToken is already set above
});
afterEach(() => {
  vi.clearAllMocks(); // clears call history on all spies/mocks
});
beforeAll(() => {
  userToken = makeTestToken({ role: "CUSTOMER" });
});

describe("POST /api/sweets/:id/purchase", () => {
  it("200 → decreases quantity when enough stock", async () => {
    const id = "sweet1";

    // Mock existing sweet with stock
    (prismaClient.sweet.findUnique as any).mockResolvedValue({
      id,
      name: "Rasgulla",
      quantity: 10,
    });

    // Mock update result after decrement
    (prismaClient.sweet.update as any).mockResolvedValue({
      id,
      name: "Rasgulla",
      quantity: 7,
    });

    const res = await request(app)
      .post(`/api/sweets/${id}/purchase`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 3 })
      .expect(200);

    expect(res.body.quantity).toBe(7);
    expect(prismaClient.sweet.update).toHaveBeenCalledWith({
      where: { id },
      data: { quantity: { decrement: 3 } },
    });
  });

  it("409 → fails when insufficient stock", async () => {
    const id = "sweet2";
    (prismaClient.sweet.findUnique as any).mockResolvedValue({ id, quantity: 2 });

    const res = await request(app)
      .post(`/api/sweets/${id}/purchase`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 5 })
      .expect(409);

    expect(res.body).toHaveProperty("message");
    expect(prismaClient.sweet.update).not.toHaveBeenCalled();
  });

  it("404 → when sweet not found", async () => {
    (prismaClient.sweet.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/sweets/missing/purchase")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 1 })
      .expect(404);

    expect(res.body).toHaveProperty("message");
  });

  it("411 → validation error when quantity ≤ 0", async () => {
    const res = await request(app)
      .post("/api/sweets/sweet3/purchase")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 0 })
      .expect(411);

    expect(res.body).toHaveProperty("message");
  });

  it("401 → rejects when Authorization header missing", async () => {
    const res = await request(app)
      .post("/api/sweets/sweet4/purchase")
      .send({ quantity: 1 });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/sweets/:id/restock (Admin only)", () => {
  it("200 → increases quantity when admin", async () => {
    const id = "sweetA";

    (prismaClient.sweet.update as any).mockResolvedValue({
      id,
      name: "Kaju Katli",
      category: "Traditional",
      price: 250,
      quantity: 15,
    });

    const res = await request(app)
      .post(`/api/sweets/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 5 })
      .expect(200);

    expect(res.body).toMatchObject({ id, quantity: 15 });
    expect(prismaClient.sweet.update).toHaveBeenCalledWith({
      where: { id },
      data: { quantity: { increment: 5 } },
    });
  });

  it("403 → rejects non-admin user", async () => {
    await request(app)
      .post("/api/sweets/sweetB/restock")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 5 })
      .expect(403);
  });

  it("411 → validation error when quantity ≤ 0", async () => {
    await request(app)
      .post("/api/sweets/sweetC/restock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 0 })
      .expect(411);

    expect(prismaClient.sweet.update).not.toHaveBeenCalled();
  });

  it("404 → when sweet not found (Prisma P2025)", async () => {
    const id = "missing-id";
    const err: any = new Error("No record found");
    err.code = "P2025";
    (prismaClient.sweet.update as any).mockRejectedValueOnce(err);

    await request(app)
      .post(`/api/sweets/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 3 })
      .expect(404);
  });

  it("401 → rejects when Authorization header missing", async () => {
    await request(app)
      .post("/api/sweets/sweetD/restock")
      .send({ quantity: 2 })
      .expect(401);
  });
});