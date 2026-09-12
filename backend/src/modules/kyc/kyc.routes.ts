import { Router } from "express";
import { kycController } from "./kyc.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { createKycRequestSchema, reviewKycRequestSchema } from "./kyc.validation.js";

export const kycRoutes = Router();

// User: submit a profile update request
kycRoutes.post(
  "/requests",
  authenticate,
  validateRequest(createKycRequestSchema),
  (req, res, next) => {
    kycController.submitRequest(req, res, next);
  }
);

// User: view my profile update requests
kycRoutes.get("/my-requests", authenticate, (req, res, next) => {
  kycController.getMyRequests(req, res, next);
});

// Admin: view all profile update requests
kycRoutes.get(
  "/admin/requests",
  authenticate,
  authorize("ROLE_ADMIN"),
  (req, res, next) => {
    kycController.getAllRequestsAdmin(req, res, next);
  }
);

// Admin: review (approve / reject) a request
kycRoutes.post(
  "/admin/requests/:id/review",
  authenticate,
  authorize("ROLE_ADMIN"),
  validateRequest(reviewKycRequestSchema),
  (req, res, next) => {
    kycController.reviewRequest(req, res, next);
  }
);
