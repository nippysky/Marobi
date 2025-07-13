// components/admin/HeroSlidesManager.tsx
'use client'
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import toast from "react-hot-toast"

interface Slide {
  id: string
  imageUrl: string
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaUrl?: string
  order: number
}

export default function HeroSlidesManager({ initialSlides }: { initialSlides: Slide[] }) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides)

  function updateSlide(idx: number, patch: Partial<Slide>) {
    setSlides(s => {
      const copy = [...s]
      copy[idx] = { ...copy[idx], ...patch }
      return copy
    })
  }

  function addSlide() {
    setSlides(s => [...s, {
      id: "", imageUrl: "", order: s.length, headline: "", subheadline: "", ctaText: "", ctaUrl: ""
    }])
  }

  async function save() {
    try {
      await fetch("/api/store-settings/hero-slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slides)
      })
      toast.success("Hero slides saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  // Simple Cloudinary upload helper
  async function uploadFile(file: File): Promise<string> {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    const json = await res.json()
    return json.data.secure_url
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <div key={i} className="p-4 border rounded grid grid-cols-6 gap-2 items-end">
          {/* Image preview & upload */}
          <div className="col-span-2">
            {slide.imageUrl
              ? <img src={slide.imageUrl} className="w-full h-24 object-cover rounded" />
              : <div className="w-full h-24 bg-gray-100 rounded" />
            }
            <input
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={async e => {
                if (!e.target.files) return
                const url = await uploadFile(e.target.files[0])
                updateSlide(i, { imageUrl: url })
              }}
            />
          </div>

          {/* Text fields */}
          <Input
            className="col-span-1"
            placeholder="Headline"
            value={slide.headline || ""}
            onChange={e => updateSlide(i, { headline: e.target.value })}
          />
          <Input
            className="col-span-1"
            placeholder="Subheadline"
            value={slide.subheadline || ""}
            onChange={e => updateSlide(i, { subheadline: e.target.value })}
          />
          <Input
            className="col-span-1"
            placeholder="CTA Text"
            value={slide.ctaText || ""}
            onChange={e => updateSlide(i, { ctaText: e.target.value })}
          />
          <Input
            className="col-span-1"
            placeholder="CTA URL"
            value={slide.ctaUrl || ""}
            onChange={e => updateSlide(i, { ctaUrl: e.target.value })}
          />

          {/* Order & remove */}
          <Input
            type="number"
            className="w-16"
            value={slide.order}
            onChange={e => updateSlide(i, { order: +e.target.value })}
          />
          <button
            className="text-red-600 p-1"
            onClick={() => setSlides(s => s.filter((_, j) => j !== i))}
          >
            <Trash2 />
          </button>
        </div>
      ))}

      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={addSlide}>
          <Plus /> Add Slide
        </Button>
        <Button onClick={save}>Save Hero Slides</Button>
      </div>
    </div>
)
}
