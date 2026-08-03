import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration file.
 * Connection URLs have been moved here from schema.prisma per Prisma 7 requirements.
 * See: https://pris.ly/d/config-datasource
 */
export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
    // directUrl is used for Prisma Migrate (bypasses connection pooler)
    directUrl: process.env.DIRECT_URL,
  },
});
