import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email address"),
    mobileNumber: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
    password: z.string().min(4, "Password must be at least 4 characters"),
    accountType: z.enum(["SAVINGS", "CURRENT"]).optional().default("SAVINGS"),
    mpin: z.string().regex(/^\d{4}$/, "MPIN must be 4 digits").optional().default("1234"),
    aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),
    dob: z.string().optional().or(z.literal("")),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});
