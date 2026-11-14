// Creates or updates the single admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
// Used by the seed (local) and by bootstrap.ts on every deploy (production).
import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";

export async function ensureAdmin(db: PrismaClient, emailInput: string, adminPassword: string) {
  // The env is the source of truth for the admin: a changed ADMIN_EMAIL / ADMIN_PASSWORD is applied.
  const adminEmail = emailInput.trim().toLowerCase();
  if (adminPassword.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");

  const byEmail = await db.user.findUnique({ where: { email: adminEmail } });
  if (byEmail && byEmail.role !== "ADMIN") {
    throw new Error(`${adminEmail} already belongs to a client account. Use a different ADMIN_EMAIL.`);
  }
  // Reuse the existing admin (e.g. after changing ADMIN_EMAIL) instead of creating a second one.
  const existing = byEmail ?? (await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }));

  if (existing) {
    const passwordMatches = await bcrypt.compare(adminPassword, existing.passwordHash);
    await db.user.update({
      where: { id: existing.id },
      data: {
        email: adminEmail,
        emailVerified: existing.emailVerified ?? new Date(),
        ...(passwordMatches ? {} : { passwordHash: await bcrypt.hash(adminPassword, 12) }),
      },
    });
    const changes = [existing.email !== adminEmail && `email ${existing.email} → ${adminEmail}`, !passwordMatches && "password updated"];
    console.log(`✓ admin: ${adminEmail}${changes.some(Boolean) ? ` (${changes.filter(Boolean).join(", ")})` : ""}`);
  } else {
    await db.user.create({
      data: {
        email: adminEmail,
        name: "Lumora Admin",
        role: "ADMIN",
        emailVerified: new Date(),
        passwordHash: await bcrypt.hash(adminPassword, 12),
      },
    });
    console.log(`✓ admin created: ${adminEmail}`);
  }
}
