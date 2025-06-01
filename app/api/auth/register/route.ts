// app/api/auth/register/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      location,
      shippingAddress,
      billingAddress,
    } = body as {
      name: string;
      email: string;
      password: string;
      phone: string;
      location: string;
      shippingAddress: string;
      billingAddress: string;
    };

    // TODO: In production, check if email already exists, hash password, save to DB, etc.
    // For now, accept any registration and set the same “loggedIn” cookie:
    const response = NextResponse.json({ message: "Registration successful" });
    response.cookies.set("loggedIn", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
