import { api } from "./api.js";
import { ApiResponse, Account } from "../types/index.js";

export interface DepositResponseData {
  accountNumber: string;
  balance: number;
  amountDeposited: number;
  transactionId: number;
  message: string;
}

export const accountService = {
  async getMyAccount() {
    const res = await api.get<ApiResponse<Account>>("/accounts/me");
    return res.data;
  },

  async checkBalance(mpin: string) {
    const res = await api.post<ApiResponse<{ accountNumber: string; balance: number; accountType: string; dailyLimit: number }>>("/accounts/check-balance", {
      mpin,
    });
    return res.data;
  },

  async changeMpin(currentMpin: string, newMpin: string) {
    const res = await api.post<ApiResponse<{ message: string }>>("/accounts/change-mpin", {
      currentMpin,
      newMpin,
    });
    return res.data;
  },

  async adminDeposit(userId: number, amount: number) {
    const res = await api.post<ApiResponse<DepositResponseData>>("/accounts/deposit", {
      userId,
      amount,
    });
    return res.data;
  },
};
