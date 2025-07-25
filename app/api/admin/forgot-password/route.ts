import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendResetPasswordEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // 1) Check staff existence in prod DB
  const staff = await prisma.staff.findUnique({ where: { email } });
  if (!staff) {
    // reveal non‑existence for admins
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  // 2) Generate token + expiry
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // +1h

  // 3) Persist token & expiry as strings
  await prisma.staff.update({
    where: { id: staff.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expires.toISOString(),   // ← serialize to string
    },
  });

  // 4) Send the reset email
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;
  await sendResetPasswordEmail(email, { resetUrl });

  return NextResponse.json({ success: true });
}
