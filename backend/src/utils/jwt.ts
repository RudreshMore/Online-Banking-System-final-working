import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { AuthenticatedUser } from "../types/express.js";

export function generateToken(payload: AuthenticatedUser): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AuthenticatedUser {
  return jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
}
