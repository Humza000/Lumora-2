import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decryptSession } from "@/lib/session-token";

// Optimistic, cookie-only checks (no DB). Real authorization happens in src/lib/dal.ts.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await decryptSession(req.cookies.get(SESSION_COOKIE)?.value);

  const isQuote = pathname === "/quote" || pathname.startsWith("/quote/");
  const needsAuth = pathname.startsWith("/admin") || pathname.startsWith("/portal");

  if (needsAuth && !session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Guests use the public quote wizard (and sign up on its last step); signed-in clients use the
  // same wizard inside their portal.
  if (isQuote && session) {
    const target = session.role === "ADMIN" ? "/admin" : `/portal${pathname}${search}`;
    return NextResponse.redirect(new URL(target, req.url));
  }

  if (session) {
    if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
    if (pathname.startsWith("/portal") && session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // /login and /signup always show their form: each tab must log in itself (see components/tab-session.tsx).
  matcher: ["/admin/:path*", "/portal/:path*", "/quote/:path*", "/quote"],
};
