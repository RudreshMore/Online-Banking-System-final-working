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
  const account = await prisma.account.findUnique({
    where: { userId: admin.id },
  });

  if (!account) {
    await prisma.account.create({
      data: {
        accountNumber: "AC" + Date.now(),
        balance: 1000.0,
        userId: admin.id,
      },
    });
    console.log("[Seed] Created bank account for admin with ₹1,000 balance");
  } else {
    console.log("[Seed] Admin bank account already exists:", account.accountNumber);
  }
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
