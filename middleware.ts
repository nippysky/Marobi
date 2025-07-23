import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/admin-login",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Always let _next, favicons, and your public auth pages through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // 2) Protect anything under /admin
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!,
      cookieName: "marobi_session",
    });

    if (!token || token.role === "customer") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin-login";  // ASCII hyphen-minus here too
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};

