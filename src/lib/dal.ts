import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { readSession } from "./session";

/**
 * Data Access Layer: the real authorization boundary.
 * proxy.ts only does optimistic redirects; every page, server action and route
 * handler that touches private data must call one of these guards.
 */

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, emailVerified: true },
  });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/portal");
  return user;
}

export async function requireClient(next?: string): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== "CLIENT") redirect("/admin");
  return user;
}

/** Clients must verify their email before using the quote wizard. */
export async function requireVerifiedClient(next?: string): Promise<CurrentUser> {
  const user = await requireClient(next);
  if (!user.emailVerified) redirect("/check-email");
  return user;
}
