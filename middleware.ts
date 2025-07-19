// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_PATH_SET = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

export async function middleware(req: NextRequest) {
    
  // Normalize pathname (strip trailing slash except root)
  let pathname = req.nextUrl.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  if (AUTH_PATH_SET.has(pathname)) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "marobi_session", // IMPORTANT: custom cookie
    });

    if (token) {
      const url = req.nextUrl.clone();
      url.pathname = "/account";
      return NextResponse.redirect(url);
    }

    console.log("Cookies seen:", req.cookies.getAll().map(c => c.name));
    console.log("Token:", token);

  }

  

  return NextResponse.next();
}



export const config = {
  matcher: [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
  ],
};
