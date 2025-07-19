import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendResetPasswordEmail } from "@/lib/mail";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const emailNorm = normalizeEmail(email);

  let user = await prisma.customer.findUnique({ where: { email: emailNorm } });
  if (!user) {
    // case-insensitive legacy match
    const legacy = await prisma.customer.findFirst({
      where: { email: { equals: emailNorm, mode: "insensitive" } },
    });
    if (legacy) {
      user = await prisma.customer.update({
        where: { id: legacy.id },
        data: { email: emailNorm },
      });
    }
  }

  if (!user) {
    return NextResponse.json(
      { error: "We don't have that email on record. You may want to sign up." },
      { status: 404 }
    );
  }

  const resetToken = randomBytes(32).toString("hex");
  const expiry     = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.customer.update({
    where: { email: emailNorm },
    data: {
      resetToken,
      resetTokenExpiry: expiry,
    },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${base}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(emailNorm)}`;

  await sendResetPasswordEmail(emailNorm, { resetUrl });

  return NextResponse.json({
    message: `Password reset link sent to ${emailNorm}.`,
  });
}
