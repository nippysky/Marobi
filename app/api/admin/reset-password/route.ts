import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Compare expiry as ISO‑string, not Date object
  const staff = await prisma.staff.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date().toISOString() },
    },
  });
  if (!staff) {
    return NextResponse.json(
      { error: "Link expired or invalid" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.staff.update({
    where: { id: staff.id },
    data: {
      passwordHash:     hash,
      resetToken:       null,
      resetTokenExpiry: null,  // OK to clear to null
    },
  });

  return NextResponse.json({ success: true });
}
