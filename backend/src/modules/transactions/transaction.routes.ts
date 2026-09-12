import { Router } from "express";
import { transactionController } from "./transaction.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { transferSchema, userTransactionsParamSchema } from "./transaction.validation.js";

export const transactionRoutes = Router();

// User: Transfer money between accounts
transactionRoutes.post(
  "/transfer",
  authenticate,
  validateRequest(transferSchema),
  (req, res, next) => {
    transactionController.transferMoney(req, res, next);
  }
);

// User: View personal transaction history
transactionRoutes.get("/my", authenticate, (req, res, next) => {
  transactionController.getMyTransactions(req, res, next);
});

// Admin: View all transactions system-wide
transactionRoutes.get("/all", authenticate, authorize("ROLE_ADMIN"), (req, res, next) => {
  transactionController.getAllTransactions(req, res, next);
});

// Admin: View specific user's transactions
transactionRoutes.get(
  "/user/:userId",
  authenticate,
  authorize("ROLE_ADMIN"),
  validateRequest(userTransactionsParamSchema),
  (req, res, next) => {
    transactionController.getUserTransactions(req, res, next);
  }
);
