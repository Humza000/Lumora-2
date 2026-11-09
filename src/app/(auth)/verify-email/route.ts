import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { createSession } from "@/lib/session";

// GET /verify-email?token=...: consumes the token, marks the email verified, refreshes the session.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const userId = token ? await consumeToken(token, "EMAIL_VERIFICATION") : null;
  if (!userId) return NextResponse.redirect(new URL("/check-email?error=invalid", req.url));

  const user = await db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  await createSession({ userId: user.id, role: user.role, verified: true });
  return NextResponse.redirect(new URL(user.role === "ADMIN" ? "/admin" : "/quote", req.url));
}
