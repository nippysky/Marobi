// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/(USER-END)/auth/login",
  "/(USER-END)/auth/register",
  "/(USER-END)/auth/forgot-password",
  "/(USER-END)/auth/reset-password",
  "/admin-login",
  "/favicon.ico",
  // allow NextAuth’s built-ins
  "/api/auth",
  "/api/auth/",
];

const CUSTOMER_ONLY = ["/(USER-END)/account", "/account"];
const ADMIN_ONLY    = ["/admin", "/admin/log-sale", "/admin/settings"];

function normalize(p: string) {
  return p.replace(/\/+$/, "");
}

function isPublic(path: string) {
  const p = normalize(path);
  if (p.startsWith("/_next") || p.startsWith("/static") || p.startsWith("/favicon")) {
    return true;
  }
  return PUBLIC_PATHS.some(pub => {
    const norm = normalize(pub);
    return p === norm || p.startsWith(norm + "/");
  });
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = normalize(req.nextUrl.pathname);
  const callback = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);

  // 1) always allow public assets + auth routes
  if (isPublic(path)) return NextResponse.next();

  // 2) ensure secret
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.next();

  // 3) admin section
  if (ADMIN_ONLY.some(p => path === p || path.startsWith(p + "/"))) {
    const token = await getToken({
      req,
      secret,
      cookieName: "marobi_session",
    });
    if (!token || token.role === "customer") {
      url.pathname = "/admin-login";
      url.searchParams.set("callbackUrl", callback);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 4) customer area
  if (CUSTOMER_ONLY.some(p => path === p || path.startsWith(p + "/"))) {
    const token = await getToken({
      req,
      secret,
      cookieName: "marobi_session",
    });
    if (!token || token.role !== "customer") {
      url.pathname = "/(USER-END)/auth/login";
      url.searchParams.set("callbackUrl", callback);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 5) everything else is public
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/(USER-END)/account",
    "/(USER-END)/account/:path*",
  ],
};
