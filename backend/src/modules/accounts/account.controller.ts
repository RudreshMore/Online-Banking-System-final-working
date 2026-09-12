import { Request, Response, NextFunction } from "express";
import { accountService } from "./account.service.js";
import { sendSuccess } from "../../utils/response.js";

export class AccountController {
  async getMyAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await accountService.getMyAccount(req.user!.id);
      sendSuccess(res, data, "Account retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async checkBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mpin } = req.body;
      const data = await accountService.checkBalanceWithMpin(req.user!.id, mpin);
      sendSuccess(res, data, "Balance verified successfully");
    } catch (error) {
      next(error);
    }
  }

  async changeMpin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentMpin, newMpin } = req.body;
      const data = await accountService.changeMpin(req.user!.id, currentMpin, newMpin);
      sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }

  async adminDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, amount } = req.body;
      const data = await accountService.adminDeposit(userId, amount);
      sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }
}

export const accountController = new AccountController();
