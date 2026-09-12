export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  active: boolean;
  account?: {
    accountNumber: string;
    balance: number;
  };
}
