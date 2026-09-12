import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";

describe("Authentication & Authorization Module", () => {
  const testUser = {
    name: "Test Auth User",
    email: `testauth_${Date.now()}@bank.com`,
    mobileNumber: "9876543210",
    password: "password123",
  };

  let testUserToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Ensure clean state for test email
    const existing = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: { account: true },
    });
    if (existing) {
      if (existing.account) {
        await prisma.account.delete({ where: { id: existing.account.id } });
      }
      await prisma.user.delete({ where: { id: existing.id } });
    }
  });

  afterAll(async () => {
    // Cleanup created test user and account
    try {
      if (testUserId) {
        await prisma.account.deleteMany({ where: { userId: BigInt(testUserId) } });
        await prisma.user.deleteMany({ where: { id: BigInt(testUserId) } });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should fail validation if email is invalid", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test",
          email: "not-an-email",
          mobileNumber: "9876543210",
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should fail validation if mobile number is not 10 digits", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test",
          email: "valid@bank.com",
          mobileNumber: "123", // invalid
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should successfully register a new user and auto-create an account with ₹1,000 balance", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Account created successfully");
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.role).toBe("ROLE_USER");
      expect(res.body.data.account).toBeDefined();
      expect(res.body.data.account.accountNumber).toMatch(/^AC\d+$/);
      expect(res.body.data.account.balance).toBe(1000);

      testUserId = res.body.data.id;
    });

    it("should fail if email is already registered", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email already registered");
      expect(res.body.errorCode).toBe("CONFLICT");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should fail with 401 for non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@bank.com",
          password: "password123",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("should fail with 401 for wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("should succeed with valid credentials and return JWT token", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.role).toBe("ROLE_USER");
      expect(res.body.data.user.redirectUrl).toBe("/dashboard");

      testUserToken = res.body.data.token;
    });

    it("should succeed for admin login and return redirectUrl '/admin/dashboard'", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@bank.com",
          password: "admin123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe("ROLE_ADMIN");
      expect(res.body.data.user.redirectUrl).toBe("/admin/dashboard");
    });

    it("should fail with 403 ACCOUNT_BLOCKED if account is inactive/blocked", async () => {
      // Find a blocked user in DB (e.g. mahesh@gmail.com) or temporarily block test user
      await prisma.user.update({
        where: { id: BigInt(testUserId) },
        data: { active: false },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ACCOUNT_BLOCKED");
      expect(res.body.message).toContain("blocked by admin");

      // Re-activate test user
      await prisma.user.update({
        where: { id: BigInt(testUserId) },
        data: { active: true },
      });
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject request without Bearer token with 401", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("should reject request with invalid Bearer token with 401", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-string");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("should return user profile and account details for authenticated user", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUserId);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.account).toBeDefined();
      expect(res.body.data.account.balance).toBe(1000);
    });
  });
});
