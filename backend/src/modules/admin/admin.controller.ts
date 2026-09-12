import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export class AdminController {
  async getSpendingAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getSpendingAnalytics();
      sendSuccess(res, data, "Spending analytics retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getBankVaultOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getBankVaultOverview();
      sendSuccess(res, data, "Bank vault overview retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
