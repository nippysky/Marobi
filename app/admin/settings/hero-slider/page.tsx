// app/admin/settings/hero-slider/page.tsx
import HeroSlidesManager from "@/components/admin/HeroSlidesManager"
import { prisma } from "@/lib/db"

export default async function HeroSliderPage() {
  // 1) Load all slides, ordered
  const slidesFromDb = await prisma.heroSlide.findMany({
    orderBy: { order: "asc" },
  })

  // 2) Map null → undefined to satisfy the Slide interface
  const initialSlides = slidesFromDb.map((s) => ({
    id: s.id,
    imageUrl: s.imageUrl,
    order: s.order,
    headline: s.headline ?? undefined,
    subheadline: s.subheadline ?? undefined,
    ctaText: s.ctaText ?? undefined,
    ctaUrl: s.ctaUrl ?? undefined,
  }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Hero Slider</h1>
      <HeroSlidesManager initialSlides={initialSlides} />
    </div>
  )
}
