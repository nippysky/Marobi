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
      OR: [
        { id: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } }
      ],
      status: "Published",
    },
    include: { variants: true },
    take: 8,
  });

  return NextResponse.json(products);
}
