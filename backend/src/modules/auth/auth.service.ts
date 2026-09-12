import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateToken } from "../../utils/jwt.js";
import { RegisterDto, LoginDto } from "./auth.types.js";

export class AuthService {
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError("Email already registered", 409, ErrorCode.CONFLICT);
    }

    const hashedPassword = await hashPassword(dto.password);

    // Atomically create user and initial bank account with 1000 balance
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          mobileNumber: dto.mobileNumber,
          password: hashedPassword,
          role: "ROLE_USER",
          active: true,
        },
      });

      const account = await tx.account.create({
        data: {
          accountNumber: "AC" + Date.now(),
          balance: 1000.0,
          userId: user.id,
        },
      });

      return { user, account };
    });

    return {
      id: Number(result.user.id),
      name: result.user.name,
      email: result.user.email,
      mobileNumber: result.user.mobileNumber,
      role: result.user.role,
      active: result.user.active,
      account: {
        accountNumber: result.account.accountNumber,
        balance: Number(result.account.balance),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { account: true },
    });

    if (!user || !user.password) {
      throw new AppError("Invalid credentials", 401, ErrorCode.UNAUTHORIZED);
    }

    if (!user.active) {
      throw new AppError(
        "🔒 Your account has been blocked by admin. Please contact support.",
        403,
        ErrorCode.ACCOUNT_BLOCKED
      );
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401, ErrorCode.UNAUTHORIZED);
    }

    const token = generateToken({
      id: Number(user.id),
      email: user.email ?? "",
      role: user.role ?? "ROLE_USER",
    });

    const redirectUrl = user.role === "ROLE_ADMIN" ? "/admin/dashboard" : "/dashboard";

    return {
      token,
      user: {
        id: Number(user.id),
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "ROLE_USER",
        active: user.active,
        accountNumber: user.account?.accountNumber ?? null,
        balance: user.account?.balance ? Number(user.account.balance) : 0,
        redirectUrl,
      },
    };
  }

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { account: true },
    });

    if (!user) {
      throw new AppError("User account not found", 404, ErrorCode.NOT_FOUND);
    }

    return {
      id: Number(user.id),
      name: user.name ?? "",
      email: user.email ?? "",
      mobileNumber: user.mobileNumber,
      role: user.role ?? "ROLE_USER",
      active: user.active,
      account: user.account
        ? {
            id: Number(user.account.id),
            accountNumber: user.account.accountNumber,
            balance: Number(user.account.balance),
          }
        : null,
    };
  }
}

export const authService = new AuthService();
