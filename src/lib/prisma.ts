import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

// Sized pool for concurrent load. pgBouncer (transaction mode) multiplexes
// these logical connections, so the limit is well above the ~60 direct
// connection cap Supabase allows.
const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX ?? 20),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);

/**
 * Singleton Prisma client.
 * In development, reuses a cached instance to avoid "too many connections" from
 * hot-module reloading. In production, always creates a fresh instance.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
