import { z } from "zod";

export const createKycRequestSchema = z.object({
  body: z.object({
    requestedChanges: z
      .object({
        name: z.string().trim().min(2).optional(),
        aadhaarNumber: z.string().trim().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional(),
        dob: z.string().trim().optional(),
        photoUrl: z.string().trim().optional(),
      })
      .refine(
        (data) => data.name || data.aadhaarNumber || data.dob || data.photoUrl,
        { message: "At least one field to update must be provided" }
      ),
    reason: z.string().trim().min(5, "Please provide a valid reason for updating your profile (min 5 characters)"),
    proofDocument: z.string().trim().optional(),
  }),
});

export const reviewKycRequestSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    adminComment: z.string().trim().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Request ID must be a number"),
  }),
});
