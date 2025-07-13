import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  // Ensure there’s always exactly one size‐chart
  let chart = await prisma.sizeChart.findFirst({ include: { entries: true } })
  if (!chart) {
    chart = await prisma.sizeChart.create({
      data: { name: "", entries: { create: [] } },
      include: { entries: true },
    })
  }
  return NextResponse.json(chart)
}

export async function PUT(req: Request) {
  const { id, entries }: {
    id: string
    entries: Array<{
      id?: string
      sizeLabel: string
      chestMin: number
      chestMax: number
      waistMin: number
      waistMax: number
    }>
  } = await req.json()

  // Upsert the chart itself (we ignore name since frontend no longer uses it)
  const chart = await prisma.sizeChart.upsert({
    where: { id },
    create: { id, name: "", entries: { create: [] } },
    update: {}, // nothing to update on the chart row
  })

  // Figure out which entry IDs are still present
  const incomingIds = entries.map((e) => e.id).filter(Boolean) as string[]

  // Delete any entries the UI has removed
  await prisma.sizeChartEntry.deleteMany({
    where: {
      chartId: chart.id,
      id: { notIn: incomingIds },
    },
  })

  // Upsert each incoming row
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
      },
      update: {
        sizeLabel: e.sizeLabel,
        chestMin: e.chestMin,
        chestMax: e.chestMax,
        waistMin: e.waistMin,
        waistMax: e.waistMax,
      },
    })
  )

  await prisma.$transaction(ops)
  return NextResponse.json({ success: true })
}
