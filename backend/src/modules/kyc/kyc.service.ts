import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";
import { CreateKycRequestDto, RequestedChanges } from "./kyc.types.js";

export class KycService {
  async submitRequest(userId: number, dto: CreateKycRequestDto) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new AppError("User not found", 404, ErrorCode.NOT_FOUND);
    }

    const request = await prisma.profileUpdateRequest.create({
      data: {
        userId: BigInt(userId),
        requestedChanges: JSON.stringify(dto.requestedChanges),
        reason: dto.reason,
        proofDocument: dto.proofDocument || null,
        status: "PENDING",
      },
    });

    return {
      id: Number(request.id),
      status: request.status,
      reason: request.reason,
      requestedChanges: dto.requestedChanges,
      proofDocument: request.proofDocument,
      createdAt: request.createdAt.toISOString(),
      message: "Profile update request submitted successfully. It will be reviewed by the Bank Admin.",
    };
  }

  async getMyRequests(userId: number) {
    const requests = await prisma.profileUpdateRequest.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((req) => {
      let parsedChanges: RequestedChanges = {};
      try {
        parsedChanges = JSON.parse(req.requestedChanges);
      } catch {
        parsedChanges = {};
      }

      return {
        id: Number(req.id),
        status: req.status,
        reason: req.reason,
        requestedChanges: parsedChanges,
        proofDocument: req.proofDocument,
        adminComment: req.adminComment,
        reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
        createdAt: req.createdAt.toISOString(),
      };
    });
  }

  async getAllRequestsAdmin() {
    const requests = await prisma.profileUpdateRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobileNumber: true,
            aadhaarNumber: true,
            dob: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((req) => {
      let parsedChanges: RequestedChanges = {};
      try {
        parsedChanges = JSON.parse(req.requestedChanges);
      } catch {
        parsedChanges = {};
      }

      return {
        id: Number(req.id),
        status: req.status,
        reason: req.reason,
        requestedChanges: parsedChanges,
        proofDocument: req.proofDocument,
        adminComment: req.adminComment,
        reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,
        createdAt: req.createdAt.toISOString(),
        user: {
          id: Number(req.user.id),
          name: req.user.name,
          email: req.user.email,
          mobileNumber: req.user.mobileNumber,
          currentAadhaar: req.user.aadhaarNumber,
          currentDob: req.user.dob,
          currentPhoto: req.user.photoUrl,
        },
      };
    });
  }

  async reviewRequest(requestId: number, status: "APPROVED" | "REJECTED", adminComment?: string) {
    const request = await prisma.profileUpdateRequest.findUnique({
      where: { id: BigInt(requestId) },
      include: { user: true },
    });

    if (!request) {
      throw new AppError("KYC request not found", 404, ErrorCode.NOT_FOUND);
    }

    if (request.status !== "PENDING") {
      throw new AppError(`Request has already been ${request.status.toLowerCase()}`, 400, ErrorCode.BAD_REQUEST);
    }

    if (status === "REJECTED" && (!adminComment || adminComment.trim().length === 0)) {
      throw new AppError("Please provide a reason for rejecting the request", 400, ErrorCode.BAD_REQUEST);
    }

    let parsedChanges: RequestedChanges = {};
    try {
      parsedChanges = JSON.parse(request.requestedChanges);
    } catch {
      parsedChanges = {};
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      if (status === "APPROVED") {
        const updateData: any = {};
        if (parsedChanges.name) updateData.name = parsedChanges.name;
        if (parsedChanges.aadhaarNumber) updateData.aadhaarNumber = parsedChanges.aadhaarNumber;
        if (parsedChanges.dob) updateData.dob = parsedChanges.dob;
        if (parsedChanges.photoUrl) updateData.photoUrl = parsedChanges.photoUrl;

        if (Object.keys(updateData).length > 0) {
          await tx.user.update({
            where: { id: request.userId },
            data: updateData,
          });
        }
      }

      const updatedRequest = await tx.profileUpdateRequest.update({
        where: { id: BigInt(requestId) },
        data: {
          status,
          adminComment: adminComment || (status === "APPROVED" ? "Approved by Bank Admin" : null),
          reviewedAt: now,
        },
      });

      return updatedRequest;
    });

    return {
      id: Number(result.id),
      status: result.status,
      adminComment: result.adminComment,
      reviewedAt: result.reviewedAt ? result.reviewedAt.toISOString() : null,
      message: status === "APPROVED" ? "Profile update request approved and user profile updated!" : "Profile update request rejected.",
    };
  }
}

export const kycService = new KycService();
