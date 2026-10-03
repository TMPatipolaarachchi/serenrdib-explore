// Prisma 7 configuration. Environment variables are NOT loaded automatically,
// so we load `.env` here with dotenv.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read directly (instead of `env()`) so `prisma generate` works without a DB URL.
    url: process.env["DATABASE_URL"],
  },
});
