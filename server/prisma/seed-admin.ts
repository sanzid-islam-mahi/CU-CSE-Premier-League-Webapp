import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@cse.cu.ac.bd";
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "CSE Dept Administrator";
  const studentId = process.env.ADMIN_STUDENT_ID || "ADMIN01";

  const hashedPassword = await bcrypt.hash(adminPasswordPlain, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      isTemporaryPassword: false,
    },
    create: {
      studentId,
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isTemporaryPassword: false,
      bio: "Department of Computer Science & Engineering, University of Chittagong.",
    },
  });

  console.log("=========================================");
  console.log("🛡️  Super Admin Ready!");
  console.log("=========================================");
  console.log(`👤 Name:     ${admin.name}`);
  console.log(`📧 Email:    ${admin.email}`);
  console.log(`🔑 Password: ${adminPasswordPlain}`);
  console.log(`🆔 Roll:     ${admin.studentId}`);
  console.log(`👑 Role:     ${admin.role}`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Admin seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
