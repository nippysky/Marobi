import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { reviewId: string } }
) {
  // TODO: enforce admin auth (NextAuth role check)
  const { reviewId } = params;

  // 1. Fetch the review with product stats in one go (two queries inside a tx anyway)
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      rating: true,
      productId: true,
      product: {
        select: {
          id: true,
          averageRating: true,
          ratingCount: true,
        },
      },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const {
    rating,
    productId,
    product: { averageRating, ratingCount },
  } = review;

  // 2. Compute new stats BEFORE transaction (pure math)
  let newAverage = 0;
  let newCount = 0;

  if (ratingCount > 1) {
    newCount = ratingCount - 1;
    newAverage = (averageRating * ratingCount - rating) / newCount;
  } else {
    newCount = 0;
    newAverage = 0;
  }

  try {
    // 3. Transaction: delete review + update product
    await prisma.$transaction([
      prisma.review.delete({ where: { id: reviewId } }),
      prisma.product.update({
        where: { id: productId },
        data: {
          averageRating: newAverage,
            ratingCount: newCount,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reviewId,
      productId,
      newProductStats: {
        averageRating: newAverage,
        ratingCount: newCount,
      },
    });
  } catch (err) {
    console.error("Delete review error:", err);
    return NextResponse.json(
      { error: "Could not delete review" },
      { status: 500 }
    );
  }
}
