import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";
import { comparePassword, hashPassword } from "../../utils/password.js";

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
      accountType: account.accountType,
      dailyLimit: Number(account.dailyLimit),
      monthlyLimit: Number(account.monthlyLimit),
      hasMpin: !!account.mpin,
      userId: Number(account.userId),
    };
  }

  async checkBalanceWithMpin(userId: number, mpin: string) {
    const account = await prisma.account.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!account) {
      throw new AppError("Account not found", 404, ErrorCode.NOT_FOUND);
    }

    if (!account.mpin) {
      throw new AppError("MPIN is not set for this account. Please set an MPIN first.", 400, ErrorCode.BAD_REQUEST);
    }

    const isValid = await comparePassword(mpin, account.mpin);
    if (!isValid) {
      throw new AppError("Incorrect MPIN. Please enter your valid 4-digit security PIN.", 401, ErrorCode.UNAUTHORIZED);
    }

    return {
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: Number(account.balance),
      dailyLimit: Number(account.dailyLimit),
    };
  }

  async changeMpin(userId: number, currentMpin: string, newMpin: string) {
    const account = await prisma.account.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!account) {
      throw new AppError("Account not found", 404, ErrorCode.NOT_FOUND);
    }

    if (account.mpin) {
      const isValid = await comparePassword(currentMpin, account.mpin);
      if (!isValid) {
        throw new AppError("Current MPIN is incorrect", 401, ErrorCode.UNAUTHORIZED);
      }
    }

    const hashedNewMpin = await hashPassword(newMpin);
    await prisma.account.update({
      where: { id: account.id },
      data: { mpin: hashedNewMpin },
    });

    return {
      message: "MPIN updated successfully!",
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
