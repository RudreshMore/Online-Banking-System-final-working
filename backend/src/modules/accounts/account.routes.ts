import { Router } from "express";
import { accountController } from "./account.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { depositSchema, checkBalanceSchema, changeMpinSchema } from "./account.validation.js";

export const accountRoutes = Router();

// Current authenticated user's account details
accountRoutes.get("/me", authenticate, (req, res, next) => {
  accountController.getMyAccount(req, res, next);
});

// Check balance with MPIN verification
accountRoutes.post(
  "/check-balance",
  authenticate,
  validateRequest(checkBalanceSchema),
  (req, res, next) => {
    accountController.checkBalance(req, res, next);
  }
);

// Set or change MPIN
accountRoutes.post(
  "/change-mpin",
  authenticate,
  validateRequest(changeMpinSchema),
  (req, res, next) => {
    accountController.changeMpin(req, res, next);
  }
);

// Admin: deposit into user account
accountRoutes.post(
  "/deposit",
  authenticate,
  authorize("ROLE_ADMIN"),
  validateRequest(depositSchema),
  (req, res, next) => {
    accountController.adminDeposit(req, res, next);
  }
);

