/**
 * Emergency admin reset — run with `npm run admin:reset`.
 *
 * Resets the "admin" account to the default password ("admin@123"), forces a
 * password change on the next login, signs out every admin session and clears
 * the login rate-limit history. Use it if you are locked out.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const passwordHash = await bcrypt.hash("admin@123", 12);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash, mustChangePassword: true, passwordVersion: { increment: 1 } },
    create: { username: "admin", passwordHash, mustChangePassword: true },
  });
  await prisma.adminLoginAttempt.deleteMany({ where: { username: "admin" } });
  console.log('✓ Admin reset. Sign in at /admin/login with "admin" / "admin@123" and choose a new password.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
