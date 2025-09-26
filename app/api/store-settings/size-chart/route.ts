// app/api/size-chart/route.ts
import { NextResponse } from "next/server";
import prisma, { prismaReady } from "@/lib/db";

type IncomingEntry = {
  id?: string;
  sizeLabel: string;
  chestMin: number;
  chestMax: number;
  waistMin: number;
  waistMax: number;
  hipMin: number;
  hipMax: number;
};

/**
 * Ensure there is exactly one SizeChart row and return its data.
 */
export async function GET() {
  await prismaReady;

  try {
    // 1) Try to fetch the one-and-only chart
    let chart = await prisma.sizeChart.findFirst({
      include: { entries: true },
    });

    // 2) If none exists yet, create it
    if (!chart) {
      chart = await prisma.sizeChart.create({
        data: { name: "", entries: { create: [] } },
        include: { entries: true },
      });
    }

    // 3) Shape and return just { id, entries }
    return NextResponse.json({
      id: chart.id,
      entries: chart.entries
        .slice()
        .sort((a, b) => a.chestMin - b.chestMin)
        .map((e) => ({
          id: e.id,
          sizeLabel: e.sizeLabel,
          chestMin: e.chestMin,
          chestMax: e.chestMax,
          waistMin: e.waistMin,
          waistMax: e.waistMax,
          hipMin: e.hipMin,
          hipMax: e.hipMax,
        })),
    });
  } catch (err) {
    console.error("SIZE CHART GET ERROR", err);
    return NextResponse.json(
      { message: "Failed to load size chart" },
      { status: 500 }
    );
  }
}

/**
 * Upsert the single SizeChart's entries.
 * Body: { id: string; entries: IncomingEntry[] }
 */
export async function PUT(req: Request) {
  await prismaReady;

  try {
    const { id, entries }: { id: string; entries: IncomingEntry[] } =
      await req.json();

    if (typeof id !== "string" || !Array.isArray(entries)) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Ensure the chart exists
    const chart = await prisma.sizeChart.upsert({
      where: { id },
      create: { id, name: "", entries: { create: [] } },
      update: {},
    });

    // Normalize & validate incoming entries minimally
    const cleaned: IncomingEntry[] = entries
      .map((e) => ({
        ...e,
        sizeLabel: String(e.sizeLabel || "").trim(),
        chestMin: Number(e.chestMin),
        chestMax: Number(e.chestMax),
        waistMin: Number(e.waistMin),
        waistMax: Number(e.waistMax),
        hipMin: Number(e.hipMin),
        hipMax: Number(e.hipMax),
      }))
      .filter(
        (e) =>
          e.sizeLabel &&
          Number.isFinite(e.chestMin) &&
          Number.isFinite(e.chestMax) &&
          Number.isFinite(e.waistMin) &&
          Number.isFinite(e.waistMax) &&
          Number.isFinite(e.hipMin) &&
          Number.isFinite(e.hipMax)
      );

    // IDs to keep (only those that are present and truthy)
    const keepIds = cleaned.map((e) => e.id).filter(Boolean) as string[];

    // Build transactional operations:
    // 1) Delete any entries no longer present
    // 2) Upsert each incoming entry
    const upsertOps = cleaned.map((e) =>
      prisma.sizeChartEntry.upsert({
        where: { id: e.id ?? "" }, // if id is omitted/empty, create path will run
        create: {
          chartId: chart.id,
          sizeLabel: e.sizeLabel,
          chestMin: e.chestMin,
          chestMax: e.chestMax,
          waistMin: e.waistMin,
          waistMax: e.waistMax,
          hipMin: e.hipMin,
          hipMax: e.hipMax,
        },
        update: {
          sizeLabel: e.sizeLabel,
          chestMin: e.chestMin,
          chestMax: e.chestMax,
          waistMin: e.waistMin,
          waistMax: e.waistMax,
          hipMin: e.hipMin,
          hipMax: e.hipMax,
        },
      })
    );

    await prisma.$transaction([
      prisma.sizeChartEntry.deleteMany({
        where: {
          chartId: chart.id,
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
        },
      }),
      ...upsertOps,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SIZE CHART PUT ERROR", err);
    return NextResponse.json(
      { message: "Failed to save size chart" },
      { status: 500 }
    );
  }
}
