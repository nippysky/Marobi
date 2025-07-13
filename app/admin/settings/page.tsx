// app/admin/store-settings/page.tsx
import HeroSlidesManager from "@/components/admin/HeroSlidesManager"
import SizeChartManager from "@/components/admin/SizeChartManager"
import StorePoliciesManager from "@/components/admin/StorePoliciesManager"
import { headers } from "next/headers"

export default async function StoreSettingsPage() {
  // Grab the current host and pick http vs https
  const host = (await headers()).get("host")!
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const origin = `${protocol}://${host}`

  // Build fully-qualified URLs
  const [slidesRes, sizeChartRes, policiesRes] = await Promise.all([
    fetch(`${origin}/api/store-settings/hero-slides`),
    fetch(`${origin}/api/store-settings/size-chart`),
    fetch(`${origin}/api/store-settings/policies`),
  ])

  if (!slidesRes.ok || !sizeChartRes.ok || !policiesRes.ok) {
    throw new Error("Failed to load store-settings data")
  }

  const slides    = await slidesRes.json()
  const sizeChart = await sizeChartRes.json()
  const policies  = await policiesRes.json()

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-3xl font-bold">Store Settings</h1>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Hero Slider</h2>
        <HeroSlidesManager initialSlides={slides} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Size Chart</h2>
        <SizeChartManager initialChart={sizeChart} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Store Policies</h2>
        <StorePoliciesManager initialPolicies={policies} />
      </section>
    </div>
  )
}
