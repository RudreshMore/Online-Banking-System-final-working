export interface User {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  role: "ROLE_USER" | "ROLE_ADMIN" | string;
  active: boolean;
  aadhaarNumber?: string | null;
  dob?: string | null;
  photoUrl?: string | null;
  accountType?: string;
  account?: Account;
}

export interface Account {
  id: number;
  accountNumber: string;
  balance: number;
  userId: number;
  accountType?: "SAVINGS" | "CURRENT" | "BANK_VAULT" | string;
  dailyLimit?: number;
  monthlyLimit?: number;
  hasMpin?: boolean;
}

export interface Transaction {
  id: number;
  fromAccount: string | null;
  toAccount: string | null;
  amount: number;
  fee?: number;
  tax?: number;
  totalAmount?: number;
  senderName?: string;
  receiverName?: string;
  referenceId?: string;
  status?: string;
  type: "DEBIT" | "CREDIT" | "ADMIN_DEPOSIT" | "FEE_REVENUE" | string;
  transactionDate: string;
}

export interface ProfileUpdateRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  reason: string;
  requestedChanges: {
    name?: string;
    aadhaarNumber?: string;
    dob?: string;
    photoUrl?: string;
  };
  proofDocument?: string | null;
  adminComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    mobileNumber: string;
    currentAadhaar?: string | null;
    currentDob?: string | null;
    currentPhoto?: string | null;
  };
}

export interface UserSpendingAnalytics {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  active: boolean;
  aadhaarNumber?: string | null;
  dob?: string | null;
  accountNumber: string | null;
  accountType: string | null;
  balance: number;
  dailyLimit: number;
  todaySpend: number;
  monthSpend: number;
  yearSpend: number;
  totalFeesPaid: number;
  totalTaxPaid: number;
}

export interface BankVaultOverview {
  vaultAccountNumber: string;
  vaultBalance: number;
  totalTransactionsCharged: number;
  totalFeesCollected: number;
  totalTaxCollected: number;
  totalRevenue: number;
  recentTransactions: Array<{
    id: number;
    fromAccount: string;
    fee: number;
    tax: number;
    amount: number;
    referenceId: string;
    transactionDate: string;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}
