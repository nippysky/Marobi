import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

export async function GET() {
  try {
    // 1) Try to fetch the one-and-only chart
    let chart = await prisma.sizeChart.findFirst({ include: { entries: true } });

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

export async function PUT(req: Request) {
  try {
    const { id, entries }: { id: string; entries: IncomingEntry[] } = await req.json();

    if (typeof id !== "string" || !Array.isArray(entries)) {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    // ensure chart exists
    const chart = await prisma.sizeChart.upsert({
      where: { id },
      create: { id, name: "", entries: { create: [] } },
      update: {},
    });

    const keepIds = entries.map((e) => e.id).filter(Boolean) as string[];

    // delete removed entries
    await prisma.sizeChartEntry.deleteMany({
      where: { chartId: chart.id, id: { notIn: keepIds } },
    });

    // upsert incoming
    const ops = entries.map((e) =>
      prisma.sizeChartEntry.upsert({
        where: { id: e.id ?? "" },
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

    await prisma.$transaction(ops);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SIZE CHART PUT ERROR", err);
    return NextResponse.json(
      { message: "Failed to save size chart" },
      { status: 500 }
    );
  }
}
