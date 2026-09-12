import { Router, Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";

export const router = Router();

// Health check endpoint
router.get("/health", (_req: Request, res: Response) => {
  sendSuccess(res, { status: "OK", timestamp: new Date().toISOString() }, "SecureBank API is running");
});

// Module routers will be mounted here in future phases:
// router.use("/auth", authRoutes);
// router.use("/users", userRoutes);
// router.use("/accounts", accountRoutes);
// router.use("/transactions", transactionRoutes);
// router.use("/admin", adminRoutes);
