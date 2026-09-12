import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { generateToken } from "../../utils/jwt.js";

describe("Transactions Module", () => {
  let adminToken: string;
  let senderToken: string;
  let senderUserId: number;
  let senderAccountNumber: string;

  let receiverUserId: number;
  let receiverAccountNumber: string;

  beforeAll(async () => {
    // 1. Admin token
    const admin = await prisma.user.findFirst({
      where: { role: "ROLE_ADMIN" },
    });
    adminToken = generateToken({
      id: Number(admin!.id),
      email: admin!.email ?? "",
      role: admin!.role ?? "ROLE_ADMIN",
    });

    // 2. Sender user with 2000 initial balance
    senderAccountNumber = "AC" + Date.now() + Math.floor(1000 + Math.random() * 9000);
    const sender = await prisma.user.create({
      data: {
        name: "Sender User",
        email: `sender_${Date.now()}_${Math.random().toString(36).substring(7)}@bank.com`,
        mobileNumber: "9112233445",
        password: "hashedpassword",
        role: "ROLE_USER",
        active: true,
        account: {
          create: {
            accountNumber: senderAccountNumber,
            balance: 2000.0,
          },
        },
      },
      include: { account: true },
    });
    senderUserId = Number(sender.id);
    senderToken = generateToken({
      id: senderUserId,
      email: sender.email ?? "",
      role: sender.role ?? "ROLE_USER",
    });

    // 3. Receiver user with 500 initial balance
    receiverAccountNumber = "AC" + Date.now() + Math.floor(1000 + Math.random() * 9000);
    const receiver = await prisma.user.create({
      data: {
        name: "Receiver User",
        email: `receiver_${Date.now()}_${Math.random().toString(36).substring(7)}@bank.com`,
        mobileNumber: "9112233446",
        password: "hashedpassword",
        role: "ROLE_USER",
        active: true,
        account: {
          create: {
            accountNumber: receiverAccountNumber,
            balance: 500.0,
          },
        },
      },
      include: { account: true },
    });
    receiverUserId = Number(receiver.id);
  });

  afterAll(async () => {
    try {
      // Clean up test transactions
      await prisma.transaction.deleteMany({
        where: {
          OR: [
            { fromAccount: senderAccountNumber },
            { toAccount: senderAccountNumber },
            { fromAccount: receiverAccountNumber },
            { toAccount: receiverAccountNumber },
          ],
        },
      });

      // Clean up test accounts & users
      if (senderUserId) {
        await prisma.account.deleteMany({ where: { userId: BigInt(senderUserId) } });
        await prisma.user.deleteMany({ where: { id: BigInt(senderUserId) } });
      }
      if (receiverUserId) {
        await prisma.account.deleteMany({ where: { userId: BigInt(receiverUserId) } });
        await prisma.user.deleteMany({ where: { id: BigInt(receiverUserId) } });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  });

  describe("POST /api/transactions/transfer", () => {
    it("should reject transfer to self with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          toAccount: senderAccountNumber,
          amount: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Sender and receiver cannot be same");
    });

    it("should reject transfer with non-positive amount with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          toAccount: receiverAccountNumber,
          amount: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should reject transfer to non-existent account with 404 Not Found", async () => {
      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          toAccount: "AC_DOES_NOT_EXIST",
          amount: 100,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Receiver account not found");
    });

    it("should reject transfer when sender has insufficient balance", async () => {
      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          toAccount: receiverAccountNumber,
          amount: 50000, // Sender only has 2000
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Insufficient balance");
      expect(res.body.errorCode).toBe("INSUFFICIENT_FUNDS");
    });

    it("should successfully execute atomic transfer, updating balances and creating DEBIT/CREDIT records", async () => {
      const transferAmount = 600;

      const res = await request(app)
        .post("/api/transactions/transfer")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          toAccount: receiverAccountNumber,
          amount: transferAmount,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("Money transferred successfully!");
      expect(res.body.data.senderBalance).toBe(1400); // 2000 - 600

      // Verify recipient balance in database
      const receiverAcc = await prisma.account.findUnique({
        where: { accountNumber: receiverAccountNumber },
      });
      expect(Number(receiverAcc!.balance)).toBe(1100); // 500 + 600

      // Verify DEBIT transaction
      const debitTx = await prisma.transaction.findFirst({
        where: {
          fromAccount: senderAccountNumber,
          toAccount: receiverAccountNumber,
          type: "DEBIT",
        },
      });
      expect(debitTx).not.toBeNull();
      expect(Number(debitTx!.amount)).toBe(transferAmount);

      // Verify CREDIT transaction
      const creditTx = await prisma.transaction.findFirst({
        where: {
          fromAccount: senderAccountNumber,
          toAccount: receiverAccountNumber,
          type: "CREDIT",
        },
      });
      expect(creditTx).not.toBeNull();
      expect(Number(creditTx!.amount)).toBe(transferAmount);
    });
  });

  describe("GET /api/transactions/my", () => {
    it("should return the caller's transaction history", async () => {
      const res = await request(app)
        .get("/api/transactions/my")
        .set("Authorization", `Bearer ${senderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("GET /api/transactions/all (Admin only)", () => {
    it("should reject non-admin request with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/transactions/all")
        .set("Authorization", `Bearer ${senderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should allow admin to view all transactions", async () => {
      const res = await request(app)
        .get("/api/transactions/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/transactions/user/:userId (Admin only)", () => {
    it("should reject non-admin request with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/transactions/user/${senderUserId}`)
        .set("Authorization", `Bearer ${senderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should allow admin to view transactions of a specific user", async () => {
      const res = await request(app)
        .get(`/api/transactions/user/${senderUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(senderUserId);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });
  });
});
