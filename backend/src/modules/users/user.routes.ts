import { Router } from "express";
import { userController } from "./user.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { toggleUserSchema } from "./user.validation.js";

export const userRoutes = Router();

// Current user profile
userRoutes.get("/profile", authenticate, (req, res, next) => {
  userController.getProfile(req, res, next);
});

// Admin: view all users
userRoutes.get("/", authenticate, authorize("ROLE_ADMIN"), (req, res, next) => {
  userController.getAllUsers(req, res, next);
});

// Admin: toggle user active / block status
userRoutes.patch(
  "/:id/toggle",
  authenticate,
  authorize("ROLE_ADMIN"),
  validateRequest(toggleUserSchema),
  (req, res, next) => {
    userController.toggleUserActive(req, res, next);
  }
);
