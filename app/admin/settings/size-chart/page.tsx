// app/admin/settings/size-chart/page.tsx
import SizeChartManager from "@/components/admin/SizeChartManager"
import { prisma } from "@/lib/db"

export default async function SizeChartPage() {
  // 1) Try to fetch your one-and-only chart
  let chart = await prisma.sizeChart.findFirst({
    include: { entries: true },
  })

  // 2) If none exists yet, create a blank one
  if (!chart) {
    chart = await prisma.sizeChart.create({
      data: {
        name: "",
        entries: { create: [] },
      },
      include: { entries: true },
    })
  }

  // 3) shape into the Chart interface
  const initialChart = {
    id: chart.id,
    name: chart.name,
    entries: chart.entries.map((e) => ({
      id: e.id,
      sizeLabel: e.sizeLabel,
      chestMin: e.chestMin,
      chestMax: e.chestMax,
      waistMin: e.waistMin,
      waistMax: e.waistMax,
    })),
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Size Chart</h1>
      <SizeChartManager initialChart={initialChart} />
    </div>
  )
}
