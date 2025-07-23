import { getServerSession } from "next-auth/next";
import { authOptions }        from "@/app/api/auth/[...nextauth]/route";
import { prisma }             from "@/lib/db";
import { NextResponse }       from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const staff = await prisma.staff.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      emailPersonal: true,
      phone: true,
      address: true,
      jobRoles: true,
      access: true,
      dateOfBirth: true,
      dateOfEmployment: true,
    },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  return NextResponse.json(staff);
}
