import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { generateToken } from "../../utils/jwt.js";

describe("Accounts Module", () => {
  let adminToken: string;
  let userToken: string;
  let testUserId: number;
  let testAccountNumber: string;

  beforeAll(async () => {
    // 1. Admin
    const admin = await prisma.user.findFirst({
      where: { role: "ROLE_ADMIN" },
    });
    adminToken = generateToken({
      id: Number(admin!.id),
      email: admin!.email ?? "",
      role: admin!.role ?? "ROLE_ADMIN",
    });

    // 2. Regular user
    testAccountNumber = "AC" + Date.now() + Math.floor(1000 + Math.random() * 9000);
    const user = await prisma.user.create({
      data: {
        name: "Test Account Holder",
        email: `acc_test_${Date.now()}@bank.com`,
        mobileNumber: "9876543212",
        password: "hashedpassword",
        role: "ROLE_USER",
        active: true,
        account: {
          create: {
            accountNumber: testAccountNumber,
            balance: 1000.0,
          },
        },
      },
      include: { account: true },
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
        // cleanup transactions created during test
        await prisma.transaction.deleteMany({
          where: { toAccount: testAccountNumber },
        });
        await prisma.account.deleteMany({ where: { userId: BigInt(testUserId) } });
        await prisma.user.deleteMany({ where: { id: BigInt(testUserId) } });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  });

  describe("GET /api/accounts/me", () => {
    it("should return current user's account details", async () => {
      const res = await request(app)
        .get("/api/accounts/me")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountNumber).toBe(testAccountNumber);
      expect(res.body.data.balance).toBe(1000);
      expect(res.body.data.userId).toBe(testUserId);
    });

    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/accounts/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/accounts/deposit (Admin only)", () => {
    it("should reject deposit by non-admin with 403 Forbidden", async () => {
      const res = await request(app)
        .post("/api/accounts/deposit")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          userId: testUserId,
          amount: 500,
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should reject deposit with non-positive amount with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/accounts/deposit")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: testUserId,
          amount: -50,
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should successfully deposit funds and create ADMIN_DEPOSIT transaction", async () => {
      const res = await request(app)
        .post("/api/accounts/deposit")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: testUserId,
          amount: 750,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountNumber).toBe(testAccountNumber);
      expect(res.body.data.balance).toBe(1750); // 1000 initial + 750 deposit
      expect(res.body.data.message).toBe("₹750 deposited successfully");

      // Verify transaction was logged in database
      const tx = await prisma.transaction.findFirst({
        where: {
          toAccount: testAccountNumber,
          type: "ADMIN_DEPOSIT",
        },
      });

      expect(tx).not.toBeNull();
      expect(tx!.fromAccount).toBe("BANK");
      expect(Number(tx!.amount)).toBe(750);
    });
  });
});
