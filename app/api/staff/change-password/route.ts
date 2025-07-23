import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role === "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req
    .json()
    .catch(() => ({}));

  if (
    !currentPassword ||
    !newPassword ||
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string"
  ) {
    return NextResponse.json(
      { error: "Both passwords are required" },
      { status: 400 }
    );
  }

  const staff = await prisma.staff.findUnique({
    where: { id: session.user.id },
  });
  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, staff.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 403 }
    );
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.staff.update({
    where: { id: staff.id },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ success: true });
}
