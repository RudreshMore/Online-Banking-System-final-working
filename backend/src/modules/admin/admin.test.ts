import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { generateToken } from "../../utils/jwt.js";

describe("Admin Analytics & Vault Module", () => {
  let adminToken: string;
  let userToken: string;

  let testUserId: number;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({
      where: { role: "ROLE_ADMIN" },
    });
    adminToken = generateToken({
      id: Number(admin!.id),
      email: admin!.email ?? "",
      role: admin!.role ?? "ROLE_ADMIN",
    });

    const user = await prisma.user.create({
      data: {
        name: "Regular Test User",
        email: `reg_admin_test_${Date.now()}@bank.com`,
        mobileNumber: "9876543214",
        password: "hashedpassword",
        role: "ROLE_USER",
        active: true,
      },
    });

    testUserId = Number(user.id);
    userToken = generateToken({
      id: testUserId,
      email: user.email ?? "",
      role: user.role ?? "ROLE_USER",
    });
  });

  afterAll(async () => {
    try {
      if (testUserId) {
        await prisma.user.deleteMany({ where: { id: BigInt(testUserId) } });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  });

  describe("GET /api/admin/analytics/users", () => {
    it("should reject non-admin request with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/analytics/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should return user spending analytics broken down by today, month, and year", async () => {
      const res = await request(app)
        .get("/api/admin/analytics/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const item = res.body.data[0];
        expect(item).toHaveProperty("todaySpend");
        expect(item).toHaveProperty("monthSpend");
        expect(item).toHaveProperty("yearSpend");
        expect(item).toHaveProperty("totalFeesPaid");
        expect(item).toHaveProperty("totalTaxPaid");
        expect(item).toHaveProperty("accountType");
      }
    });
  });

  describe("GET /api/admin/vault", () => {
    it("should reject non-admin request with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/vault")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should return bank reserve vault overview and revenue totals", async () => {
      const res = await request(app)
        .get("/api/admin/vault")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vaultAccountNumber).toBe("ACC-BANK-RESERVE-001");
      expect(res.body.data).toHaveProperty("vaultBalance");
      expect(res.body.data).toHaveProperty("totalFeesCollected");
      expect(res.body.data).toHaveProperty("totalTaxCollected");
      expect(Array.isArray(res.body.data.recentTransactions)).toBe(true);
    });
  });
});
