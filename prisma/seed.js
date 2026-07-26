const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL || "compliance@primecapital.et").toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_SEED_NAME || "Compliance Officer";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name, role: "compliance_officer" },
  });

  await prisma.kycCounter.upsert({
    where: { id: "kyc" },
    update: {},
    create: { id: "kyc", value: 100000 },
  });

  console.log("Seed complete.");
  console.log(`Admin user: ${email}`);
  console.log(`Password:   ${password} (change in production)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
