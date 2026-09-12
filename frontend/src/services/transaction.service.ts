import { api } from "./api.js";
import { ApiResponse, Transaction, User } from "../types/index.js";

export interface TransferRequest {
  toAccount: string;
  amount: number;
  mpin?: string;
}

export interface TransferResponseData {
  message: string;
  referenceId?: string;
  fromAccount: string;
  toAccount: string;
  senderName?: string;
  receiverName?: string;
  amount: number;
  fee?: number;
  tax?: number;
  totalDebited?: number;
  senderBalance: number;
}

export interface UserTransactionsResponse {
  user: Pick<User, "id" | "name" | "email"> & { accountNumber?: string };
  transactions: Transaction[];
}

export const transactionService = {
  async transfer(payload: TransferRequest) {
    const res = await api.post<ApiResponse<TransferResponseData>>(
      "/transactions/transfer",
      payload
    );
    return res.data;
  },

  async getMyTransactions() {
    const res = await api.get<ApiResponse<Transaction[]>>("/transactions/my");
    return res.data;
  },

  async getAllTransactions() {
    const res = await api.get<ApiResponse<Transaction[]>>("/transactions/all");
    return res.data;
  },

  async getUserTransactions(userId: number) {
    const res = await api.get<ApiResponse<UserTransactionsResponse>>(
      `/transactions/user/${userId}`
    );
    return res.data;
  },
};
