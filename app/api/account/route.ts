import { getServerSession } from "next-auth/next";
import { authOptions }      from "@/app/api/auth/[...nextauth]/route";
import { prisma }           from "@/lib/db";
import { NextResponse }     from "next/server";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // pull exactly what your client sends:
  const {
    firstName,
    lastName,
    email,
    phone,
    address,        // this is your deliveryAddress
    billingAddress,
    country,
    state,
  } = await request.json();

  // update the customer row
  await prisma.customer.update({
    where: { email: session.user.email },
    data: {
      firstName,
      lastName,
      email,
      phone,
      deliveryAddress: address,
      billingAddress,
      country,
      state,
    },
  });

  return NextResponse.json({ message: "Profile updated" });
}
