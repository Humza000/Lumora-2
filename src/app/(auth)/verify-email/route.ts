import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { consumeToken, usedTokenUser } from "@/lib/tokens";
import { createSession, readSession } from "@/lib/session";
import { clientNext } from "@/lib/validation";

// GET /verify-email?token=...&next=...: consumes the token, marks the email verified, refreshes the session.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const next = clientNext(req.nextUrl.searchParams.get("next"), "/quote");
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));

  const userId = token ? await consumeToken(token, "EMAIL_VERIFICATION") : null;
  if (userId) {
    const user = await db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
    await createSession({ userId: user.id, role: user.role, verified: true });
    return to(user.role === "ADMIN" ? "/admin" : next);
  }

  // A link that was already used (clicked twice, or pre-opened by a mail scanner) isn't an error
  // if the account is verified: carry on rather than showing "invalid link".
  const used = token ? await usedTokenUser(token, "EMAIL_VERIFICATION") : null;
  if (used?.emailVerified) {
    const session = await readSession();
    if (session?.userId !== used.id) return to("/login?verified=1");
    await createSession({ userId: used.id, role: used.role, verified: true });
    return to(used.role === "ADMIN" ? "/admin" : next);
  }

  return to("/check-email?error=invalid");
}
