import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await authService.register(req.body);
      sendSuccess(res, data, "Account created successfully! Please login.", 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await authService.login(req.body);
      sendSuccess(res, data, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await authService.getMe(req.user!.id);
      sendSuccess(res, data, "User profile retrieved");
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
