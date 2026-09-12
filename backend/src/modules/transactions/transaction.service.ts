import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";

export class TransactionService {
  async transferMoney(callerUserId: number, toAccountRaw: string, amount: number) {
    if (amount <= 0) {
      throw new AppError("Invalid transfer amount", 400, ErrorCode.BAD_REQUEST);
    }

    const senderAccount = await prisma.account.findUnique({
      where: { userId: BigInt(callerUserId) },
    });

    if (!senderAccount || !senderAccount.accountNumber) {
      throw new AppError("Sender account not found", 404, ErrorCode.NOT_FOUND);
    }

    const fromAccNo = senderAccount.accountNumber.trim();
    const toAccNo = toAccountRaw.trim();

    if (fromAccNo.toLowerCase() === toAccNo.toLowerCase()) {
      throw new AppError("Sender and receiver cannot be same", 400, ErrorCode.BAD_REQUEST);
    }

    const receiverAccount = await prisma.account.findUnique({
      where: { accountNumber: toAccNo },
    });

    if (!receiverAccount || !receiverAccount.accountNumber) {
      throw new AppError("Receiver account not found", 404, ErrorCode.NOT_FOUND);
    }

    const currentBalance = Number(senderAccount.balance);
    if (currentBalance < amount) {
      throw new AppError("Insufficient balance", 400, ErrorCode.INSUFFICIENT_FUNDS);
    }

    const decimalAmount = new Prisma.Decimal(amount.toFixed(2));
    const now = new Date();

    // Atomic execution of balance updates and dual-entry ledger records
    const result = await prisma.$transaction(async (tx) => {
      // 1. Debit sender
      const updatedSender = await tx.account.update({
        where: { id: senderAccount.id },
        data: {
          balance: {
            decrement: decimalAmount,
          },
        },
      });

      // 2. Credit receiver
      const updatedReceiver = await tx.account.update({
        where: { id: receiverAccount.id },
        data: {
          balance: {
            increment: decimalAmount,
          },
        },
      });

      // 3. Dual ledger records: DEBIT and CREDIT
      const debitTx = await tx.transaction.create({
        data: {
          type: "DEBIT",
          fromAccount: fromAccNo,
          toAccount: toAccNo,
          amount: decimalAmount,
          transactionDate: now,
        },
      });

      const creditTx = await tx.transaction.create({
        data: {
          type: "CREDIT",
          fromAccount: fromAccNo,
          toAccount: toAccNo,
          amount: decimalAmount,
          transactionDate: now,
        },
      });

      return {
        updatedSender,
        updatedReceiver,
        debitTx,
        creditTx,
      };
    });

    return {
      message: "Money transferred successfully!",
      fromAccount: fromAccNo,
      toAccount: toAccNo,
      amount,
      senderBalance: Number(result.updatedSender.balance),
    };
  }

  async getMyTransactions(callerUserId: number) {
    const account = await prisma.account.findUnique({
      where: { userId: BigInt(callerUserId) },
    });

    if (!account || !account.accountNumber) {
      return [];
    }

    const accNo = account.accountNumber;

    const txs = await prisma.transaction.findMany({
      where: {
        OR: [{ fromAccount: accNo }, { toAccount: accNo }],
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    return txs.map((tx) => ({
      id: Number(tx.id),
      type: tx.type,
      fromAccount: tx.fromAccount,
      toAccount: tx.toAccount,
      amount: Number(tx.amount),
      transactionDate: tx.transactionDate ? tx.transactionDate.toISOString() : null,
    }));
  }

  async getAllTransactions() {
    const txs = await prisma.transaction.findMany({
      orderBy: {
        transactionDate: "desc",
      },
    });

    return txs.map((tx) => ({
      id: Number(tx.id),
      type: tx.type,
      fromAccount: tx.fromAccount,
      toAccount: tx.toAccount,
      amount: Number(tx.amount),
      transactionDate: tx.transactionDate ? tx.transactionDate.toISOString() : null,
    }));
  }

  async getUserTransactions(targetUserId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(targetUserId) },
      include: { account: true },
    });

    if (!user) {
      throw new AppError("User not found", 404, ErrorCode.NOT_FOUND);
    }

    if (!user.account || !user.account.accountNumber) {
      return {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
        },
        transactions: [],
      };
    }

    const accNo = user.account.accountNumber;

    const txs = await prisma.transaction.findMany({
      where: {
        OR: [{ fromAccount: accNo }, { toAccount: accNo }],
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    return {
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        accountNumber: accNo,
      },
      transactions: txs.map((tx) => ({
        id: Number(tx.id),
        type: tx.type,
        fromAccount: tx.fromAccount,
        toAccount: tx.toAccount,
        amount: Number(tx.amount),
        transactionDate: tx.transactionDate ? tx.transactionDate.toISOString() : null,
      })),
    };
  }
}

export const transactionService = new TransactionService();
