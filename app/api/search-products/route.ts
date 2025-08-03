import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? "";

  if (!query || query.length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  const products = await prisma.product.findMany({
    where: {
      AND: [
        {
          status: "Published",
        },
        {
          OR: [
            { id: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      variants: {
        select: {
          color: true,
          size: true,
          stock: true,
        },
      },
      sizeMods: true,
      images: true,
      priceNGN: true,
      priceUSD: true,
      priceEUR: true,
      priceGBP: true,
    },
    take: 8,
  });

  return NextResponse.json(products);
}
