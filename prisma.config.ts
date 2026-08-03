import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

// Prisma CLI doesn't load .env.local (Next.js convention), so we load .env here.
dotenv.config({ path: ".env" });

/**
 * Prisma 7 configuration file.
 * Connection URLs live here (not in schema.prisma) per Prisma 7 requirements.
 * See: https://pris.ly/d/config-datasource
 */
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
  migrations: {
    seed: "npx tsx ./prisma/seed.ts",
  },
});
