import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Utility: coerce positive int with bounds
function parsePositiveInt(value: string | null, fallback: number, max: number) {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  // TODO: enforce admin auth (NextAuth session + role check)
  const productId = params.productId;

  const url = new URL(req.url);
  const page = parsePositiveInt(url.searchParams.get("page"), 1, 10_000);
  const pageSize = parsePositiveInt(url.searchParams.get("pageSize"), 50, 100);
  const ratingParam = url.searchParams.get("rating");
  const q = url.searchParams.get("q")?.trim() || "";

  let ratingFilter: number | undefined;
  if (ratingParam) {
    const r = Number(ratingParam);
    if (Number.isInteger(r) && r >= 1 && r <= 5) ratingFilter = r;
  }

  // Fetch product basics (fast)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      averageRating: true,
      ratingCount: true,
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // WHERE clause for filtered list & totalFiltered
  const filteredWhere = {
    productId,
    ...(ratingFilter ? { rating: ratingFilter } : {}),
    ...(q
      ? {
          body: {
            contains: q,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  // Parallel queries:
  // 1. Filtered count
  // 2. Filtered page slice
  // 3. Global star breakdown (ignoring q & rating filter)
  const skip = (page - 1) * pageSize;

  const [totalFiltered, pageData, starGroups] = await Promise.all([
    prisma.review.count({ where: filteredWhere }),
    prisma.review.findMany({
      where: filteredWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        rating: true,
        body: true,
        createdAt: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { rating: true },
    }),
  ]);

  // Normalize star breakdown to ensure all 1..5 keys exist
  const starBreakdown: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const g of starGroups) {
    starBreakdown[String(g.rating)] = g._count.rating;
  }

  return NextResponse.json({
    meta: {
      productId,
      page,
      pageSize,
      totalFiltered,
      averageRating: product.averageRating,
      ratingCount: product.ratingCount,
      starBreakdown,
    },
    data: pageData,
  });
}
