import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCtor?: typeof PrismaClient;
};

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// In development, reuse one client across hot reloads (avoids exhausting connections),
// but use a fresh one when `prisma generate` produced a new client (schema changed), so
// new fields work without restarting the dev server.
// The old client is NOT disconnected: separately bundled code (e.g. a route handler) can load
// its own copy of the generated client while other modules still hold the old one, and with a
// driver adapter a disconnected client fails every later query ("connection closed").
const reusable = globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient;

export const db = reusable ? globalForPrisma.prisma! : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaCtor = PrismaClient;
}
