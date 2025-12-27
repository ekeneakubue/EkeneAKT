import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function normalizeDatabaseUrl(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  // strip surrounding single/double quotes if present
  const unquoted = trimmed.replace(/^['"]|['"]$/g, "");

  // Neon needs sslmode=require in many setups
  if (unquoted.includes("neon.tech") && !unquoted.includes("sslmode=")) {
    const separator = unquoted.includes("?") ? "&" : "?";
    return `${unquoted}${separator}sslmode=require`;
  }

  return unquoted;
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please set it (e.g. in .env.local)."
  );
}

// Keep process.env.DATABASE_URL normalized for Prisma to read.
process.env.DATABASE_URL = databaseUrl;

const isDataProxyUrl =
  databaseUrl.startsWith("prisma://") || databaseUrl.startsWith("prisma+postgres://");

const isDirectPostgresUrl =
  databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");

// Prisma 7 can be forced into an adapter-only “client” engine via env.
// If we're using a normal Postgres URL, force the standard engine so Prisma can connect directly.
if (isDirectPostgresUrl && process.env.PRISMA_CLIENT_ENGINE_TYPE === "client") {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      '[prisma] PRISMA_CLIENT_ENGINE_TYPE="client" detected with a direct Postgres DATABASE_URL. Forcing engine type to "library" so Prisma can connect without an adapter.'
    );
  }
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

function createPrismaClient() {
  // Prisma 7 uses the "ClientEngine" by default, which requires either:
  // - `accelerateUrl` (Prisma Accelerate / Data Proxy), or
  // - `adapter` (Driver Adapter) for direct DB connections.
  if (isDirectPostgresUrl) {
    const pool =
      globalForPrisma.pgPool ??
      new Pool({
        connectionString: databaseUrl,
        // Neon and many hosted Postgres providers require SSL.
        // `sslmode=require` in the URL isn't always enough for node-postgres.
        ssl: databaseUrl.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.pgPool = pool;
    }

    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return new PrismaClient({
    ...(isDataProxyUrl ? { accelerateUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

