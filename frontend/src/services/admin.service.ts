import { api } from "./api.js";
import { ApiResponse, UserSpendingAnalytics, BankVaultOverview } from "../types/index.js";

export const adminService = {
  async getSpendingAnalytics() {
    const res = await api.get<ApiResponse<UserSpendingAnalytics[]>>("/admin/analytics/users");
    return res.data;
  },

  async getBankVaultOverview() {
    const res = await api.get<ApiResponse<BankVaultOverview>>("/admin/vault");
    return res.data;
  },
};
