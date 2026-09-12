import { ErrorCode, ErrorCodeType } from "./errorCodes.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCodeType;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 400,
    errorCode: ErrorCodeType = ErrorCode.BAD_REQUEST,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
