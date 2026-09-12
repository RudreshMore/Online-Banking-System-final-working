import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { generateToken } from "../../utils/jwt.js";

describe("Users Module", () => {
  let adminToken: string;
  let userToken: string;
  let targetUserId: number;

  beforeAll(async () => {
    // 1. Get or create admin
    let admin = await prisma.user.findFirst({
      where: { role: "ROLE_ADMIN" },
    });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: "Admin",
          email: "admin_test@bank.com",
          mobileNumber: "9999999999",
          password: "hashedpassword",
          role: "ROLE_ADMIN",
          active: true,
        },
      });
    }
    adminToken = generateToken({
      id: Number(admin.id),
      email: admin.email ?? "",
      role: admin.role ?? "ROLE_ADMIN",
    });

    // 2. Create a test regular user
    const testUser = await prisma.user.create({
      data: {
        name: "Test User For Profile",
        email: `profile_test_${Date.now()}@bank.com`,
        mobileNumber: "9876543211",
        password: "hashedpassword",
        role: "ROLE_USER",
        active: true,
        account: {
          create: {
            accountNumber: "AC" + Date.now() + Math.floor(1000 + Math.random() * 9000),
            balance: 1000.0,
          },
        },
      },
      include: { account: true },
    });

    targetUserId = Number(testUser.id);
    userToken = generateToken({
      id: targetUserId,
      email: testUser.email ?? "",
      role: testUser.role ?? "ROLE_USER",
    });
  });

  afterAll(async () => {
    try {
      if (targetUserId) {
        await prisma.account.deleteMany({ where: { userId: BigInt(targetUserId) } });
        await prisma.user.deleteMany({ where: { id: BigInt(targetUserId) } });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  });

  describe("GET /api/users/profile", () => {
    it("should return user profile with linked account for authenticated user", async () => {
      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(targetUserId);
      expect(res.body.data.name).toBe("Test User For Profile");
      expect(res.body.data.account).toBeDefined();
      expect(res.body.data.account.balance).toBe(1000);
    });

    it("should fail without auth token", async () => {
      const res = await request(app).get("/api/users/profile");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/users (Admin only)", () => {
    it("should deny access to regular user with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should allow admin to retrieve all users list", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/users/:id/toggle (Admin only)", () => {
    it("should deny access to regular user with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/users/${targetUserId}/toggle`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should allow admin to block an active user", async () => {
      const res = await request(app)
        .patch(`/api/users/${targetUserId}/toggle`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.active).toBe(false);
      expect(res.body.data.message).toBe("User blocked successfully");
    });

    it("should allow admin to unblock a blocked user", async () => {
      const res = await request(app)
        .patch(`/api/users/${targetUserId}/toggle`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.active).toBe(true);
      expect(res.body.data.message).toBe("User unblocked successfully");
    });
  });
});
