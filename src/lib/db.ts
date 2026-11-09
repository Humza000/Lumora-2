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
// but replace it when `prisma generate` produced a new client (schema changed), so
// new fields work without restarting the dev server.
const reusable = globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient;
if (globalForPrisma.prisma && !reusable) void globalForPrisma.prisma.$disconnect().catch(() => {});

export const db = reusable ? globalForPrisma.prisma! : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaCtor = PrismaClient;
}
