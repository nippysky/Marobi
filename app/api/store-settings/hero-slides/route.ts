import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";   

export async function GET() {
  // return all slides, ordered by the `order` field
  const slides = await prisma.heroSlide.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(slides);
}

export async function PUT(req: Request) {
  const slides: Array<{
    id?: string;
    imageUrl: string;
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    order: number;
  }> = await req.json();

  // upsert each slide (create new or update existing)
  const ops = slides.map((s) =>
    prisma.heroSlide.upsert({
      where: { id: s.id ?? "" },
      create: {
        imageUrl: s.imageUrl,
        headline: s.headline,
        subheadline: s.subheadline,
        ctaText: s.ctaText,
        ctaUrl: s.ctaUrl,
        order: s.order,
      },
      update: {
        imageUrl: s.imageUrl,
        headline: s.headline,
        subheadline: s.subheadline,
        ctaText: s.ctaText,
        ctaUrl: s.ctaUrl,
        order: s.order,
      },
    })
  );

  await prisma.$transaction(ops);
  return NextResponse.json({ success: true });
}
