export interface User {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  role: "ROLE_USER" | "ROLE_ADMIN" | string;
  active: boolean;
  account?: Account;
}

export interface Account {
  id: number;
  accountNumber: string;
  balance: number;
  userId: number;
}

export interface Transaction {
  id: number;
  fromAccount: string | null;
  toAccount: string | null;
  amount: number;
  type: "DEBIT" | "CREDIT" | "ADMIN_DEPOSIT" | string;
  transactionDate: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}
