import { prisma } from "../../config/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";

export class UserService {
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { account: true },
    });

    if (!user) {
      throw new AppError("User not found", 404, ErrorCode.NOT_FOUND);
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

  async getAllUsers() {
    const users = await prisma.user.findMany({
      include: { account: true },
      orderBy: { id: "asc" },
    });

    return users.map((user) => ({
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
    }));
  }

  async toggleUserActive(targetUserId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(targetUserId) },
      include: { account: true },
    });

    if (!user) {
      throw new AppError("User not found", 404, ErrorCode.NOT_FOUND);
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(targetUserId) },
      data: { active: !user.active },
      include: { account: true },
    });

    return {
      id: Number(updatedUser.id),
      name: updatedUser.name ?? "",
      email: updatedUser.email ?? "",
      role: updatedUser.role ?? "ROLE_USER",
      active: updatedUser.active,
      message: updatedUser.active
        ? "User unblocked successfully"
        : "User blocked successfully",
    };
  }
}

export const userService = new UserService();
