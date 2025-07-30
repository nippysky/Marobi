import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";


export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = id;
  const bodyJson = await req.json();
  const rating = Number(bodyJson.rating);
  const reviewText = (bodyJson.body ?? "").trim();

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5." },
      { status: 400 }
    );
  }

  if (reviewText.length < 5) {
    return NextResponse.json(
      { error: "Review text must be at least 5 characters." },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        productId,
        customerId: customer.id,
        rating,
        body: reviewText,
      },
      select: {
        id: true,
        rating: true,
        body: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });

    return NextResponse.json(
      {
        ...review,
        averageRating: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 }
      );
    }
    console.error("Review create error:", err);
    return NextResponse.json(
      { error: "Could not submit review." },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const productId = id;

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      customer: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(reviews);
}
