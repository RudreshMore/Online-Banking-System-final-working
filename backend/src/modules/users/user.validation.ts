import { z } from "zod";

export const toggleUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "User ID must be a valid number"),
  }),
});
