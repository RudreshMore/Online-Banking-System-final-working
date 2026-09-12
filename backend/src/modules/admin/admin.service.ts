import { prisma } from "../../config/prisma.js";

export class AdminService {
  async getSpendingAnalytics() {
    const users = await prisma.user.findMany({
      where: { role: { not: "ROLE_ADMIN" } },
      include: {
        account: true,
      },
      orderBy: { id: "asc" },
    });

    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const userAnalytics = await Promise.all(
      users.map(async (u) => {
        const accNo = u.account?.accountNumber;
        if (!accNo) {
          return {
            id: Number(u.id),
            name: u.name || "Unknown",
            email: u.email || "",
            mobileNumber: u.mobileNumber,
            active: u.active,
            accountNumber: null,
            accountType: null,
            balance: 0,
            dailyLimit: 0,
            todaySpend: 0,
            monthSpend: 0,
            yearSpend: 0,
            totalFeesPaid: 0,
            totalTaxPaid: 0,
          };
        }

        // Fetch all debits for this user
        const allDebits = await prisma.transaction.findMany({
          where: {
            fromAccount: accNo,
            type: "DEBIT",
          },
          select: {
            amount: true,
            fee: true,
            tax: true,
            transactionDate: true,
          },
        });

        let todaySpend = 0;
        let monthSpend = 0;
        let yearSpend = 0;
        let totalFeesPaid = 0;
        let totalTaxPaid = 0;

        for (const tx of allDebits) {
          const txAmt = Number(tx.amount);
          const txFee = tx.fee ? Number(tx.fee) : 0;
          const txTax = tx.tax ? Number(tx.tax) : 0;
          const txDate = tx.transactionDate ? new Date(tx.transactionDate) : null;

          totalFeesPaid += txFee;
          totalTaxPaid += txTax;

          if (txDate) {
            if (txDate >= startOfDay) {
              todaySpend += txAmt;
            }
            if (txDate >= startOfMonth) {
              monthSpend += txAmt;
            }
            if (txDate >= startOfYear) {
              yearSpend += txAmt;
            }
          }
        }

        return {
          id: Number(u.id),
          name: u.name || "Unknown",
          email: u.email || "",
          mobileNumber: u.mobileNumber,
          active: u.active,
          aadhaarNumber: u.aadhaarNumber,
          dob: u.dob,
          accountNumber: accNo,
          accountType: u.account?.accountType || "SAVINGS",
          balance: Number(u.account?.balance || 0),
          dailyLimit: Number(u.account?.dailyLimit || 50000),
          todaySpend: Number(todaySpend.toFixed(2)),
          monthSpend: Number(monthSpend.toFixed(2)),
          yearSpend: Number(yearSpend.toFixed(2)),
          totalFeesPaid: Number(totalFeesPaid.toFixed(2)),
          totalTaxPaid: Number(totalTaxPaid.toFixed(2)),
        };
      })
    );

    return userAnalytics;
  }

  async getBankVaultOverview() {
    let vault = await prisma.account.findUnique({
      where: { accountNumber: "ACC-BANK-RESERVE-001" },
    });

    if (!vault) {
      vault = await prisma.account.create({
        data: {
          accountNumber: "ACC-BANK-RESERVE-001",
          balance: 0.0,
          accountType: "BANK_VAULT",
          dailyLimit: 999999999.0,
          monthlyLimit: 999999999.0,
        },
      });
    }

    const feeTxAgg = await prisma.transaction.aggregate({
      where: {
        toAccount: "ACC-BANK-RESERVE-001",
        type: "FEE_REVENUE",
      },
      _sum: {
        amount: true,
        fee: true,
        tax: true,
      },
      _count: {
        id: true,
      },
    });

    const recentFeeTransactions = await prisma.transaction.findMany({
      where: {
        toAccount: "ACC-BANK-RESERVE-001",
        type: "FEE_REVENUE",
      },
      orderBy: { transactionDate: "desc" },
      take: 20,
    });

    return {
      vaultAccountNumber: vault.accountNumber,
      vaultBalance: Number(vault.balance),
      totalTransactionsCharged: feeTxAgg._count.id,
      totalFeesCollected: Number(feeTxAgg._sum.fee || 0),
      totalTaxCollected: Number(feeTxAgg._sum.tax || 0),
      totalRevenue: Number(feeTxAgg._sum.amount || 0),
      recentTransactions: recentFeeTransactions.map((tx) => ({
        id: Number(tx.id),
        fromAccount: tx.fromAccount,
        fee: tx.fee ? Number(tx.fee) : 0,
        tax: tx.tax ? Number(tx.tax) : 0,
        amount: Number(tx.amount),
        referenceId: tx.referenceId || "TXN" + tx.id,
        transactionDate: tx.transactionDate ? tx.transactionDate.toISOString() : null,
      })),
    };
  }
}

export const adminService = new AdminService();
