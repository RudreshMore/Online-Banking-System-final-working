import { z } from "zod";

export const depositSchema = z.object({
  body: z.object({
    userId: z.number().int().positive("User ID is required"),
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});

export const checkBalanceSchema = z.object({
  body: z.object({
    mpin: z.string().regex(/^\d{4}$/, "MPIN must be exactly 4 digits"),
  }),
});

export const changeMpinSchema = z.object({
  body: z.object({
    currentMpin: z.string().regex(/^\d{4}$/, "Current MPIN must be 4 digits"),
    newMpin: z.string().regex(/^\d{4}$/, "New MPIN must be exactly 4 digits"),
  }),
});

