export type TransactionType = "DEBIT" | "CREDIT" | "ADMIN_DEPOSIT";

export interface TransferDto {
  toAccount: string;
  amount: number;
}

export interface TransactionResponse {
  id: number;
  fromAccount: string | null;
  toAccount: string | null;
  amount: number;
  type: TransactionType | string;
  transactionDate: Date;
}
