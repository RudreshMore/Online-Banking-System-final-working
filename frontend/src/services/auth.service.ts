import { api } from "./api.js";
import { ApiResponse, User } from "../types/index.js";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: User & { redirectUrl: string };
}

export const authService = {
  async login(payload: LoginRequest) {
    const res = await api.post<ApiResponse<LoginResponseData>>("/auth/login", payload);
    return res.data;
  },

  async register(payload: RegisterRequest) {
    const res = await api.post<ApiResponse<User>>("/auth/register", payload);
    return res.data;
  },

  async getMe() {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data;
  },
};
