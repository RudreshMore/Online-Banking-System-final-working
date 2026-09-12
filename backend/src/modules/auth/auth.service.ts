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
    const hashedMpin = await hashPassword(dto.mpin || "1234");
    const accountType = dto.accountType === "CURRENT" ? "CURRENT" : "SAVINGS";
    const dailyLimit = accountType === "CURRENT" ? 500000.0 : 50000.0;
    const monthlyLimit = accountType === "CURRENT" ? 2000000.0 : 200000.0;

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
          aadhaarNumber: dto.aadhaarNumber || null,
          dob: dto.dob || null,
        },
      });

      const account = await tx.account.create({
        data: {
          accountNumber: "AC" + Date.now(),
          balance: 1000.0,
          userId: user.id,
          accountType,
          mpin: hashedMpin,
          dailyLimit,
          monthlyLimit,
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
      aadhaarNumber: result.user.aadhaarNumber,
      dob: result.user.dob,
      account: {
        accountNumber: result.account.accountNumber,
        balance: Number(result.account.balance),
        accountType: result.account.accountType,
        dailyLimit: Number(result.account.dailyLimit),
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
        accountType: user.account?.accountType ?? "SAVINGS",
        dailyLimit: user.account?.dailyLimit ? Number(user.account.dailyLimit) : 50000,
        balance: user.account?.balance ? Number(user.account.balance) : 0,
        aadhaarNumber: user.aadhaarNumber,
        dob: user.dob,
        photoUrl: user.photoUrl,
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
      aadhaarNumber: user.aadhaarNumber,
      dob: user.dob,
      photoUrl: user.photoUrl,
      account: user.account
        ? {
            id: Number(user.account.id),
            accountNumber: user.account.accountNumber,
            balance: Number(user.account.balance),
            accountType: user.account.accountType,
            dailyLimit: Number(user.account.dailyLimit),
            monthlyLimit: Number(user.account.monthlyLimit),
          }
        : null,
    };
  }
}

export const authService = new AuthService();
