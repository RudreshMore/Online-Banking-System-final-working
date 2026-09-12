import { Router } from "express";
import { accountController } from "./account.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { depositSchema } from "./account.validation.js";

export const accountRoutes = Router();

// Current authenticated user's account details
accountRoutes.get("/me", authenticate, (req, res, next) => {
  accountController.getMyAccount(req, res, next);
});

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
