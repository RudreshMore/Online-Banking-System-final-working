import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userService.getProfile(req.user!.id);
      sendSuccess(res, data, "Profile retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userService.getAllUsers();
      sendSuccess(res, data, "All users retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async toggleUserActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const data = await userService.toggleUserActive(targetUserId);
      sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
