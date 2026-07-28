const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedDatabase() {
  const email = (process.env.ADMIN_SEED_EMAIL || "compliance@primecapital.et").toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_SEED_NAME || "Compliance Officer";

  const passwordHash = await bcrypt.hash(password, 12);
  const adminData = { name, role: "compliance_officer" };

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });

  if (existingAdmin) {
    await prisma.adminUser.update({
      where: { email },
      data: adminData,
    });
    console.log(`Admin user already exists: ${email}`);
  } else {
    await prisma.adminUser.create({
      data: { email, passwordHash, ...adminData },
    });
    console.log(`Admin user created: ${email}`);
    console.log(`Password:   ${password} (change in production)`);
  }

  await prisma.kycCounter.upsert({
    where: { id: "kyc" },
    update: {},
    create: { id: "kyc", value: 100000 },
  });

  console.log("Seed complete.");
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { seedDatabase };
