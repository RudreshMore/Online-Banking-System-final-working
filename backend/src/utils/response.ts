import { Response } from "express";
import { ErrorCodeType } from "../errors/errorCodes.js";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: ErrorCodeType;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message = "Operation successful",
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message = "An error occurred",
  statusCode = 400,
  errorCode?: ErrorCodeType
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode ? { errorCode } : {}),
  });
}
