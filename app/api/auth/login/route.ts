// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

/**
 * This is a development stub. In production, you would:
 * 1. Validate the credentials (email + password) against your database.
 * 2. If valid, create a secure session or JWT, set an HTTP‐only cookie, etc.
 * 3. Return a success response. If invalid, return 401 or 400.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    // TODO: replace with real auth validation:
    if (email === "demo@example.com" && password === "password123") {
      // In dev, write a fake cookie (in production, use a real session store):
      const response = NextResponse.json({ message: "Login successful" });
      response.cookies.set("loggedIn", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
