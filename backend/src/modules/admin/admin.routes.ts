import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";

export const adminRoutes = Router();

adminRoutes.get(
  "/analytics/users",
  authenticate,
  authorize("ROLE_ADMIN"),
  (req, res, next) => {
    adminController.getSpendingAnalytics(req, res, next);
  }
);

adminRoutes.get(
  "/vault",
  authenticate,
  authorize("ROLE_ADMIN"),
  (req, res, next) => {
    adminController.getBankVaultOverview(req, res, next);
  }
);
