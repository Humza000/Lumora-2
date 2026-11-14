import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decryptSession } from "@/lib/session-token";

// Optimistic, cookie-only checks (no DB). Real authorization happens in src/lib/dal.ts.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await decryptSession(req.cookies.get(SESSION_COOKIE)?.value);

  const needsAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/portal") || pathname.startsWith("/quote");

  if (needsAuth && !session) {
    const target = pathname.startsWith("/quote") ? "/signup" : "/login";
    const url = new URL(target, req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (session) {
    if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
    if ((pathname.startsWith("/portal") || pathname.startsWith("/quote")) && session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // /login and /signup always show their form: each tab must log in itself (see components/tab-session.tsx).
  matcher: ["/admin/:path*", "/portal/:path*", "/quote/:path*", "/quote"],
};
