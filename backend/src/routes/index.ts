import { Router, Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";

import { authRoutes } from "../modules/auth/auth.routes.js";
import { userRoutes } from "../modules/users/user.routes.js";
import { accountRoutes } from "../modules/accounts/account.routes.js";
import { transactionRoutes } from "../modules/transactions/transaction.routes.js";

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

// Admin routes can be mounted under /admin as convenience alias if needed:
// router.use("/admin", adminRoutes);
