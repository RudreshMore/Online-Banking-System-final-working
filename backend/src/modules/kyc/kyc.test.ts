import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../config/prisma.js";
import { generateToken } from "../../utils/jwt.js";

describe("KYC Module", () => {
  let adminToken: string;
  let userToken: string;
  let testUserId: number;
  let requestId: number;

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

    // 2. Regular user
    const user = await prisma.user.create({
      data: {
        name: "Old Name Holder",
        email: `kyc_test_${Date.now()}@bank.com`,
        mobileNumber: "9876543213",
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
        await prisma.profileUpdateRequest.deleteMany({
          where: { userId: BigInt(testUserId) },
        });
        await prisma.account.deleteMany({ where: { userId: BigInt(testUserId) } });
        await prisma.user.deleteMany({ where: { id: BigInt(testUserId) } });
      }
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  });

  describe("POST /api/kyc/requests", () => {
    it("should reject invalid request with empty changes or short reason", async () => {
      const res = await request(app)
        .post("/api/kyc/requests")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          requestedChanges: {},
          reason: "no",
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should successfully submit a profile update request with status PENDING", async () => {
      const res = await request(app)
        .post("/api/kyc/requests")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          requestedChanges: {
            name: "New Legal Name",
            aadhaarNumber: "123456789012",
            dob: "1995-05-15",
          },
          reason: "Spelling correction as per updated government Aadhaar card",
          proofDocument: "https://proofs.bank.com/aadhaar_1234.pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.requestedChanges.name).toBe("New Legal Name");
      requestId = res.body.data.id;
    });
  });

  describe("GET /api/kyc/my-requests", () => {
    it("should return the user's submitted requests", async () => {
      const res = await request(app)
        .get("/api/kyc/my-requests")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].status).toBe("PENDING");
    });
  });

  describe("GET /api/kyc/admin/requests (Admin only)", () => {
    it("should reject non-admin with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/kyc/admin/requests")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should return all requests for admin with user details", async () => {
      const res = await request(app)
        .get("/api/kyc/admin/requests")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((r: any) => r.id === requestId);
      expect(found).toBeDefined();
      expect(found.user.name).toBe("Old Name Holder");
    });
  });

  describe("POST /api/kyc/admin/requests/:id/review (Admin only)", () => {
    it("should approve the request and automatically update user's profile", async () => {
      const res = await request(app)
        .post(`/api/kyc/admin/requests/${requestId}/review`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "APPROVED",
          adminComment: "Verified against Aadhaar card. Approved.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("APPROVED");

      // Verify that user profile was actually updated in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: BigInt(testUserId) },
      });
      expect(updatedUser!.name).toBe("New Legal Name");
      expect(updatedUser!.aadhaarNumber).toBe("123456789012");
      expect(updatedUser!.dob).toBe("1995-05-15");
    });
  });
});
