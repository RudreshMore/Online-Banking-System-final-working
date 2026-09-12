import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";
import { comparePassword } from "../../utils/password.js";

export class TransactionService {
  async transferMoney(callerUserId: number, toAccountRaw: string, amount: number, mpin?: string) {
    if (amount <= 0) {
      throw new AppError("Invalid transfer amount", 400, ErrorCode.BAD_REQUEST);
    }

    const senderAccount = await prisma.account.findUnique({
      where: { userId: BigInt(callerUserId) },
      include: { user: true },
    });

    if (!senderAccount || !senderAccount.accountNumber) {
      throw new AppError("Sender account not found", 404, ErrorCode.NOT_FOUND);
    }

    // MPIN Verification if provided
    if (mpin && senderAccount.mpin) {
      const isMpinValid = await comparePassword(mpin, senderAccount.mpin);
      if (!isMpinValid) {
        throw new AppError("Invalid MPIN. Transfer declined.", 401, ErrorCode.UNAUTHORIZED);
      }
    }

    const fromAccNo = senderAccount.accountNumber.trim();
    const toAccNo = toAccountRaw.trim();

    if (fromAccNo.toLowerCase() === toAccNo.toLowerCase()) {
      throw new AppError("Sender and receiver cannot be same", 400, ErrorCode.BAD_REQUEST);
    }

    const receiverAccount = await prisma.account.findUnique({
      where: { accountNumber: toAccNo },
      include: { user: true },
    });

    if (!receiverAccount || !receiverAccount.accountNumber) {
      throw new AppError("Receiver account not found", 404, ErrorCode.NOT_FOUND);
    }

    // Platform charge: Flat ₹0.50 per transaction
    const fee = 0.5;
    // Statutory Tax: If Current account, 18% GST on platform charge (₹0.09)
    const isCurrent = senderAccount.accountType === "CURRENT";
    const tax = isCurrent ? 0.09 : 0.0;
    const totalDebit = Number((amount + fee + tax).toFixed(2));

    const currentBalance = Number(senderAccount.balance);
    if (currentBalance < totalDebit) {
      throw new AppError(
        `Insufficient balance. Total required: ₹${totalDebit.toFixed(2)} (Transfer: ₹${amount.toFixed(2)} + Platform Fee: ₹${fee.toFixed(2)}${tax > 0 ? ` + GST Tax: ₹${tax.toFixed(2)}` : ""}), Available: ₹${currentBalance.toFixed(2)}`,
        400,
        ErrorCode.INSUFFICIENT_FUNDS
      );
    }

    // Daily spending limit validation
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayDebits = await prisma.transaction.aggregate({
      where: {
        fromAccount: fromAccNo,
        type: "DEBIT",
        transactionDate: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    const todaySpent = Number(todayDebits._sum.amount || 0);
    const dailyLimit = Number(senderAccount.dailyLimit || (isCurrent ? 500000 : 50000));

    if (todaySpent + amount > dailyLimit) {
      throw new AppError(
        `Daily transaction limit exceeded for ${senderAccount.accountType} account. Daily Limit: ₹${dailyLimit.toLocaleString("en-IN")}, Already spent today: ₹${todaySpent.toFixed(2)}`,
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    // Ensure Bank Reserve Account exists
    let bankReserve = await prisma.account.findUnique({
      where: { accountNumber: "ACC-BANK-RESERVE-001" },
    });

    if (!bankReserve) {
      bankReserve = await prisma.account.create({
        data: {
          accountNumber: "ACC-BANK-RESERVE-001",
          balance: 0.0,
          accountType: "BANK_VAULT",
          dailyLimit: 999999999.0,
          monthlyLimit: 999999999.0,
        },
      });
    }

    const decimalTransferAmount = new Prisma.Decimal(amount.toFixed(2));
    const decimalTotalDebit = new Prisma.Decimal(totalDebit.toFixed(2));
    const decimalFeeAndTax = new Prisma.Decimal((fee + tax).toFixed(2));
    const now = new Date();
    const referenceId = "TXN" + Date.now() + Math.floor(Math.random() * 1000);

    const senderName = senderAccount.user?.name || "Sender";
    const receiverName = receiverAccount.user?.name || "Receiver";

    // Atomic execution of balance updates and dual-entry ledger records
    const result = await prisma.$transaction(async (tx) => {
      // 1. Debit sender total amount (Amount + Fee + Tax)
      const updatedSender = await tx.account.update({
        where: { id: senderAccount.id },
        data: {
          balance: {
            decrement: decimalTotalDebit,
          },
        },
      });

      // 2. Credit receiver transfer amount
      const updatedReceiver = await tx.account.update({
        where: { id: receiverAccount.id },
        data: {
          balance: {
            increment: decimalTransferAmount,
          },
        },
      });

      // 3. Credit bank reserve account with Fee + Tax
      await tx.account.update({
        where: { id: bankReserve!.id },
        data: {
          balance: {
            increment: decimalFeeAndTax,
          },
        },
      });

      // 4. Sender transaction record (DEBIT)
      const debitTx = await tx.transaction.create({
        data: {
          type: "DEBIT",
          fromAccount: fromAccNo,
          toAccount: toAccNo,
          amount: decimalTransferAmount,
          fee: new Prisma.Decimal(fee.toFixed(2)),
          tax: new Prisma.Decimal(tax.toFixed(2)),
          totalAmount: decimalTotalDebit,
          senderName,
          receiverName,
          referenceId,
          status: "SUCCESS",
          transactionDate: now,
        },
      });

      // 5. Receiver transaction record (CREDIT)
      const creditTx = await tx.transaction.create({
        data: {
          type: "CREDIT",
          fromAccount: fromAccNo,
          toAccount: toAccNo,
          amount: decimalTransferAmount,
          fee: new Prisma.Decimal("0.00"),
          tax: new Prisma.Decimal("0.00"),
          totalAmount: decimalTransferAmount,
          senderName,
          receiverName,
          referenceId,
          status: "SUCCESS",
          transactionDate: now,
        },
      });

      // 6. Bank Vault record (FEE_REVENUE)
      await tx.transaction.create({
        data: {
          type: "FEE_REVENUE",
          fromAccount: fromAccNo,
          toAccount: "ACC-BANK-RESERVE-001",
          amount: decimalFeeAndTax,
          fee: new Prisma.Decimal(fee.toFixed(2)),
          tax: new Prisma.Decimal(tax.toFixed(2)),
          totalAmount: decimalFeeAndTax,
          senderName,
          receiverName: "Bank Revenue Vault",
          referenceId,
          status: "SUCCESS",
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
      referenceId,
      fromAccount: fromAccNo,
      toAccount: toAccNo,
      senderName,
      receiverName,
      amount,
      fee,
      tax,
      totalDebited: totalDebit,
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
        OR: [
          { fromAccount: accNo, type: "DEBIT" },
          { toAccount: accNo, type: { in: ["CREDIT", "ADMIN_DEPOSIT"] } },
        ],
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
      fee: tx.fee ? Number(tx.fee) : 0,
      tax: tx.tax ? Number(tx.tax) : 0,
      totalAmount: tx.totalAmount ? Number(tx.totalAmount) : Number(tx.amount),
      senderName: tx.senderName || "Unknown",
      receiverName: tx.receiverName || "Unknown",
      referenceId: tx.referenceId || "TXN" + tx.id,
      status: tx.status || "SUCCESS",
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
      fee: tx.fee ? Number(tx.fee) : 0,
      tax: tx.tax ? Number(tx.tax) : 0,
      totalAmount: tx.totalAmount ? Number(tx.totalAmount) : Number(tx.amount),
      senderName: tx.senderName || "Unknown",
      receiverName: tx.receiverName || "Unknown",
      referenceId: tx.referenceId || "TXN" + tx.id,
      status: tx.status || "SUCCESS",
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
        OR: [
          { fromAccount: accNo, type: "DEBIT" },
          { toAccount: accNo, type: { in: ["CREDIT", "ADMIN_DEPOSIT"] } },
        ],
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
        fee: tx.fee ? Number(tx.fee) : 0,
        tax: tx.tax ? Number(tx.tax) : 0,
        totalAmount: tx.totalAmount ? Number(tx.totalAmount) : Number(tx.amount),
        senderName: tx.senderName || "Unknown",
        receiverName: tx.receiverName || "Unknown",
        referenceId: tx.referenceId || "TXN" + tx.id,
        status: tx.status || "SUCCESS",
        transactionDate: tx.transactionDate ? tx.transactionDate.toISOString() : null,
      })),
    };
  }
}

export const transactionService = new TransactionService();
