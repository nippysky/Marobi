import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: NextRequest,   context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    // not signed in → treat as “not wishlisted”
    return NextResponse.json({ wishlisted: false }, { status: 200 });
  }

  // look for an existing wishlist item
  const existing = await prisma.wishlistItem.findFirst({
    where: {
      productId: id,
      customer: { email: session.user.email },
    },
  });

  return NextResponse.json(
    { wishlisted: Boolean(existing) },
    { status: 200 }
  );
}

export async function POST(request: Request,  context: { params: Promise<{ id: string }> }
) {
  const { id} = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    await prisma.wishlistItem.create({
      data: {
        product:  { connect: { id } },
        customer: { connect: { email: session.user.email } },
      },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Wishlist POST error:", err);
    // Unique constraint on (customerId, productId)?
    if (
      err.code === "P2002" &&
      err.meta?.target?.some((t: string) =>
        t.includes("customerId") && t.includes("productId")
      )
    ) {
      return NextResponse.json(
        { error: "Already in wishlist" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request,  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        productId: id,
        customer:  { email: session.user.email },
      },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Wishlist DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}
