
import { NextResponse } from "next/server"
import {prisma} from "@/lib/db"

export async function GET() {
  // Try to fetch an existing chart (with its entries)
  let chart = await prisma.sizeChart.findFirst({
    include: { entries: true },
  })

  // If none exists yet, create a blank one
  if (!chart) {
    chart = await prisma.sizeChart.create({
      data: {
        name: "",
        entries: { create: [] },
      },
      include: { entries: true },
    })
  }

  return NextResponse.json(chart)
}

export async function PUT(req: Request) {
  const payload: {
    id: string
    name: string
    entries: Array<{
      id?: string
      sizeLabel: string
      chestMin: number
      chestMax: number
      waistMin: number
      waistMax: number
    }>
  } = await req.json()

  // Ensure the chart itself exists (upsert)
  const chart = await prisma.sizeChart.upsert({
    where: { id: payload.id },
    create: { id: payload.id, name: payload.name },
    update: { name: payload.name },
  })

  // Determine which entries should remain
  const incomingIds = payload.entries.map((e) => e.id).filter(Boolean) as string[]

  // Delete entries that the client has removed
  await prisma.sizeChartEntry.deleteMany({
    where: {
      chartId: chart.id,
      id: { notIn: incomingIds },
    },
  })

  // Upsert each entry (create new or update existing)
  const ops = payload.entries.map((e) =>
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
