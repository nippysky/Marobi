// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, token, password } = await req.json();

  if (!email || !token || !password) {
    return NextResponse.json(
      { error: "Email, token and password are required." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const emailNorm = email.trim().toLowerCase();
  const user = await prisma.customer.findUnique({ where: { email: emailNorm } });

  if (
    !user ||
    !user.resetToken ||
    user.resetToken !== token ||
    !user.resetTokenExpiry ||
    user.resetTokenExpiry < new Date()
  ) {
    return NextResponse.json(
      { error: "Invalid or expired reset token." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.customer.update({
    where: { email: emailNorm },
    data: {
      passwordHash:     hash,
      resetToken:       null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ message: "Password reset successful." });
}
