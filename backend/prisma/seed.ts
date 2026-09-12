import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedAdmin() {
  console.log("[Seed] Checking default admin user...");

  let admin = await prisma.user.findUnique({
    where: { email: "admin@bank.com" },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@bank.com",
        mobileNumber: "9999999999",
        password: hashedPassword,
        role: "ROLE_ADMIN",
        active: true,
      },
    });
    console.log("[Seed] Created default admin user: admin@bank.com");
  } else {
    console.log("[Seed] Admin user already exists:", admin.email);
  }

  // Check if admin has an associated bank account
  const defaultMpinHash = await bcrypt.hash("1234", 10);

  const account = await prisma.account.findUnique({
    where: { userId: admin.id },
  });

  if (!account) {
    await prisma.account.create({
      data: {
        accountNumber: "AC" + Date.now(),
        balance: 1000.0,
        userId: admin.id,
        accountType: "SAVINGS",
        mpin: defaultMpinHash,
        dailyLimit: 50000.0,
        monthlyLimit: 200000.0,
      },
    });
    console.log("[Seed] Created bank account for admin with ₹1,000 balance and default MPIN");
  } else {
    if (!account.mpin) {
      await prisma.account.update({
        where: { id: account.id },
        data: { mpin: defaultMpinHash },
      });
      console.log("[Seed] Set default MPIN for admin account");
    }
    console.log("[Seed] Admin bank account already exists:", account.accountNumber);
  }

  // Ensure Bank Reserve Account exists for collecting fees and taxes
  let bankReserve = await prisma.account.findUnique({
    where: { accountNumber: "ACC-BANK-RESERVE-001" },
  });

  if (!bankReserve) {
    bankReserve = await prisma.account.create({
      data: {
        accountNumber: "ACC-BANK-RESERVE-001",
        balance: 0.0,
        accountType: "BANK_VAULT",
        dailyLimit: 999999999.0,
        monthlyLimit: 999999999.0,
      },
    });
    console.log("[Seed] Created Bank Reserve Treasury Account: ACC-BANK-RESERVE-001");
  } else {
    console.log("[Seed] Bank Reserve Account exists:", bankReserve.accountNumber);
  }

  // Ensure all existing accounts without MPIN get default MPIN 1234
  await prisma.account.updateMany({
    where: { mpin: null, accountNumber: { not: "ACC-BANK-RESERVE-001" } },
    data: { mpin: defaultMpinHash },
  });
}

async function main() {
  await seedAdmin();
}

// When run directly via `npm run prisma:seed`
if (process.argv[1]?.includes("seed")) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

