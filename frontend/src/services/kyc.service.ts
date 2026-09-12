import { api } from "./api.js";
import { ApiResponse, ProfileUpdateRequest } from "../types/index.js";

export const kycService = {
  async submitRequest(payload: {
    requestedChanges: {
      name?: string;
      aadhaarNumber?: string;
      dob?: string;
      photoUrl?: string;
    };
    reason: string;
    proofDocument?: string;
  }) {
    const res = await api.post<ApiResponse<ProfileUpdateRequest>>("/kyc/requests", payload);
    return res.data;
  },

  async getMyRequests() {
    const res = await api.get<ApiResponse<ProfileUpdateRequest[]>>("/kyc/my-requests");
    return res.data;
  },

  async getAllRequestsAdmin() {
    const res = await api.get<ApiResponse<ProfileUpdateRequest[]>>("/kyc/admin/requests");
    return res.data;
  },

  async reviewRequest(id: number, status: "APPROVED" | "REJECTED", adminComment?: string) {
    const res = await api.post<ApiResponse<ProfileUpdateRequest>>(`/kyc/admin/requests/${id}/review`, {
      status,
      adminComment,
    });
    return res.data;
  },
};
