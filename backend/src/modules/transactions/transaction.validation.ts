import { z } from "zod";

export const transferSchema = z.object({
  body: z.object({
    toAccount: z.string().trim().min(1, "Recipient account number is required"),
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});

export const userTransactionsParamSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, "User ID must be a valid number"),
  }),
});
