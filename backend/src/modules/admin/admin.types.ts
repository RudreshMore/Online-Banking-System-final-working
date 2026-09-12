export interface AdminDepositDto {
  userId: number;
  amount: number;
}

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  active: boolean;
  account: {
    accountNumber: string;
    balance: number;
  } | null;
}
