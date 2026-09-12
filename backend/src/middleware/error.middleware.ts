import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import { ErrorCode } from "../errors/errorCodes.js";
import { sendError } from "../utils/response.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errorCode);
    return;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    sendError(res, messages || "Validation error", 400, ErrorCode.VALIDATION_ERROR);
    return;
  }

  // Fallback internal error
  console.error("Unhandled Exception:", err);
  sendError(res, "Internal server error", 500, ErrorCode.INTERNAL_ERROR);
}
