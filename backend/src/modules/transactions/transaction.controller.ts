import { Request, Response, NextFunction } from "express";
import { transactionService } from "./transaction.service.js";
import { sendSuccess } from "../../utils/response.js";

export class TransactionController {
  async transferMoney(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toAccount, amount } = req.body;
      const data = await transactionService.transferMoney(req.user!.id, toAccount, amount);
      sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }

  async getMyTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await transactionService.getMyTransactions(req.user!.id);
      sendSuccess(res, data, "Transactions retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAllTransactions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await transactionService.getAllTransactions();
      sendSuccess(res, data, "All transactions retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getUserTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      const data = await transactionService.getUserTransactions(targetUserId);
      sendSuccess(res, data, "User transactions retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
