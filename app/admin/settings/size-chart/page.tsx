import { prisma } from "@/lib/db";
import SizeChartManager from "./SizeChartManager";

export default async function SizeChartPage() {
  // 1) Try to fetch your one-and-only chart
  let chart = await prisma.sizeChart.findFirst({
    include: { entries: true },
  });

  // 2) If none exists yet, create a blank one
  if (!chart) {
    chart = await prisma.sizeChart.create({
      data: {
        name: "",
        entries: { create: [] },
      },
      include: { entries: true },
    });
  }

  // 3) shape into the Chart interface
  const initialChart = {
    id: chart.id,
    entries: chart.entries.map((e) => ({
      id: e.id,
      sizeLabel: e.sizeLabel,
      chestMin: e.chestMin,
      chestMax: e.chestMax,
      waistMin: e.waistMin,
      waistMax: e.waistMax,
      hipMin: e.hipMin ?? 0,
      hipMax: e.hipMax ?? 0,
    })),
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Size Chart</h1>
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
        <SizeChartManager initialChart={initialChart} />
      </div>
    </div>
  );
}
