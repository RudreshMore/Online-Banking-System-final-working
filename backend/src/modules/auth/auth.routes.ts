import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { registerSchema, loginSchema } from "./auth.validation.js";

export const authRoutes = Router();

authRoutes.post("/register", validateRequest(registerSchema), (req, res, next) => {
  authController.register(req, res, next);
});

authRoutes.post("/login", validateRequest(loginSchema), (req, res, next) => {
  authController.login(req, res, next);
});

authRoutes.get("/me", authenticate, (req, res, next) => {
  authController.getMe(req, res, next);
});
