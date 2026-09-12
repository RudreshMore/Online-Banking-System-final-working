import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ErrorCode } from "../errors/errorCodes.js";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication token required", 401, ErrorCode.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Authentication token required", 401, ErrorCode.UNAUTHORIZED);
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError("Invalid or expired authentication token", 401, ErrorCode.UNAUTHORIZED);
    }

    // Verify user still exists in database and is not blocked
    const user = await prisma.user.findUnique({
      where: { id: BigInt(payload.id) },
      select: { id: true, email: true, role: true, active: true },
    });

    if (!user) {
      throw new AppError("User account not found", 401, ErrorCode.UNAUTHORIZED);
    }

    if (!user.active) {
      throw new AppError(
        "Your account has been blocked by admin. Please contact support.",
        403,
        ErrorCode.ACCOUNT_BLOCKED
      );
    }

    req.user = {
      id: Number(user.id),
      email: user.email ?? "",
      role: user.role ?? "ROLE_USER",
    };

    next();
  } catch (error) {
    next(error);
  }
}
