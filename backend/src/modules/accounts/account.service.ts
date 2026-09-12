import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";

export class AccountService {
  async getMyAccount(userId: number) {
    const account = await prisma.account.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!account) {
      throw new AppError("Account not found", 404, ErrorCode.NOT_FOUND);
    }

    return {
      id: Number(account.id),
      accountNumber: account.accountNumber,
      balance: Number(account.balance),
      userId: Number(account.userId),
    };
  }

  async adminDeposit(userId: number, amount: number) {
    if (amount <= 0) {
      throw new AppError("Amount must be greater than zero", 400, ErrorCode.BAD_REQUEST);
    }

    const account = await prisma.account.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!account) {
      throw new AppError("Account not found", 404, ErrorCode.NOT_FOUND);
    }

    const decimalAmount = new Prisma.Decimal(amount.toFixed(2));

    // Execute atomic balance update and transaction record
    const result = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: decimalAmount,
          },
        },
      });

      const txRecord = await tx.transaction.create({
        data: {
          type: "ADMIN_DEPOSIT",
          fromAccount: "BANK",
          toAccount: account.accountNumber,
          amount: decimalAmount,
          transactionDate: new Date(),
        },
      });

      return { updatedAccount, txRecord };
    });

    return {
      accountNumber: result.updatedAccount.accountNumber,
      balance: Number(result.updatedAccount.balance),
      amountDeposited: amount,
      transactionId: Number(result.txRecord.id),
      message: `₹${amount} deposited successfully`,
    };
  }
}

export const accountService = new AccountService();
