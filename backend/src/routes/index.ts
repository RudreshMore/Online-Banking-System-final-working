import { Router, Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";

import { authRoutes } from "../modules/auth/auth.routes.js";
import { userRoutes } from "../modules/users/user.routes.js";
import { accountRoutes } from "../modules/accounts/account.routes.js";
import { transactionRoutes } from "../modules/transactions/transaction.routes.js";

import { kycRoutes } from "../modules/kyc/kyc.routes.js";
import { adminRoutes } from "../modules/admin/admin.routes.js";

export const router = Router();

// Health check endpoint
router.get("/health", (_req: Request, res: Response) => {
  sendSuccess(res, { status: "OK", timestamp: new Date().toISOString() }, "SecureBank API is running");
});

// Authentication routes
router.use("/auth", authRoutes);

// Users routes
router.use("/users", userRoutes);

// Accounts routes
router.use("/accounts", accountRoutes);

// Transactions routes
router.use("/transactions", transactionRoutes);

// KYC & Profile update requests routes
router.use("/kyc", kycRoutes);

// Admin analytics and vault routes
router.use("/admin", adminRoutes);

