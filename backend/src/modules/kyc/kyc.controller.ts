import { Request, Response, NextFunction } from "express";
import { kycService } from "./kyc.service.js";
import { sendSuccess } from "../../utils/response.js";

export class KycController {
  async submitRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await kycService.submitRequest(req.user!.id, req.body);
      sendSuccess(res, data, data.message, 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await kycService.getMyRequests(req.user!.id);
      sendSuccess(res, data, "Profile requests retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAllRequestsAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await kycService.getAllRequestsAdmin();
      sendSuccess(res, data, "All KYC requests retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async reviewRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = parseInt(req.params.id, 10);
      const { status, adminComment } = req.body;
      const data = await kycService.reviewRequest(requestId, status, adminComment);
      sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }
}

export const kycController = new KycController();
