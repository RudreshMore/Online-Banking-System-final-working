import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ErrorCode } from "../errors/errorCodes.js";

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401, ErrorCode.UNAUTHORIZED));
    }

    // Normalize roles to handle both "ROLE_ADMIN" and "ADMIN"
    const userRole = req.user.role.toUpperCase();
    const normalizedUserRole = userRole.startsWith("ROLE_") ? userRole : `ROLE_${userRole}`;

    const hasRole = allowedRoles.some((role) => {
      const normalizedTarget = role.toUpperCase().startsWith("ROLE_")
        ? role.toUpperCase()
        : `ROLE_${role.toUpperCase()}`;
      return normalizedUserRole === normalizedTarget;
    });

    if (!hasRole) {
      return next(
        new AppError("Access denied: insufficient permissions", 403, ErrorCode.FORBIDDEN)
      );
    }

    next();
  };
}
