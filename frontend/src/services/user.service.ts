import { api } from "./api.js";
import { ApiResponse, User } from "../types/index.js";

export const userService = {
  async getProfile() {
    const res = await api.get<ApiResponse<User>>("/users/profile");
    return res.data;
  },

  async getAllUsers() {
    const res = await api.get<ApiResponse<User[]>>("/users");
    return res.data;
  },

  async toggleUserActive(userId: number) {
    const res = await api.patch<ApiResponse<{ id: number; active: boolean; message: string }>>(
      `/users/${userId}/toggle`
    );
    return res.data;
  },
};
