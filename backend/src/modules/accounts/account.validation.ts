import { z } from "zod";

export const depositSchema = z.object({
  body: z.object({
    userId: z.number().int().positive("User ID is required"),
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});
