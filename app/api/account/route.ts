import { getServerSession } from "next-auth/next";
import { authOptions }      from "@/app/api/auth/[...nextauth]/route";
import { prisma }           from "@/lib/db";
import { NextResponse }     from "next/server";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, email, phone, deliveryAddress, billingAddress } =
    await request.json();

  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || "";

  await prisma.customer.update({
    where: { email: session.user.email },
    data: {
      firstName,
      lastName,
      email,
      phone,
      deliveryAddress,
      billingAddress,
    },
  });

  return NextResponse.json({ message: "Profile updated" });
}
