// components/admin/HeroSlidesManager.tsx
'use client'

import React, { useState } from 'react'
import { v4 as uuid } from 'uuid'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import BackButton from '../BackButton'

interface Slide {
  id: string
  imageUrl: string
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaUrl?: string
  order: number
}

export default function HeroSlidesManager({
  initialSlides,
}: {
  initialSlides: Slide[]
}) {
  // state
  const [slides, setSlides] = useState<Slide[]>(initialSlides)
  const [openIds, setOpenIds] = useState<string[]>(
    initialSlides.map((s) => s.id)
  )

  // patch one slide
  const updateSlide = (id: string, patch: Partial<Slide>) => {
    setSlides((all) =>
      all.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl))
    )
  }

  // delete on DB & from UI
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/store-settings/hero-slides/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete failed')
      toast.success('Slide deleted')
      setSlides((all) => all.filter((sl) => sl.id !== id))
      setOpenIds((open) => open.filter((x) => x !== id))
    } catch {
      toast.error('Failed to delete slide')
    }
  }

  // add new slide (open its accordion immediately)
  const addSlide = () => {
    const newId = uuid()
    setSlides((all) => [
      ...all,
      {
        id: newId,
        imageUrl: '',
        headline: '',
        subheadline: '',
        ctaText: '',
        ctaUrl: '',
        order: all.length,
      },
    ])
    setOpenIds((open) => [...open, newId])
  }

  // upload helper
  async function uploadFile(file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const json = await res.json()
    return json.data.secure_url
  }

  // save all slides in one go
  const saveAll = async () => {
    try {
      const res = await fetch('/api/store-settings/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slides),
      })
      if (!res.ok) throw new Error('save failed')
      toast.success('Hero slides saved!')
    } catch {
      toast.error('Failed to save hero slides.')
    }
  }

  // disable “Save All” until every slide has an image
  const anyMissingImage = slides.some((sl) => !sl.imageUrl)

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header + Save */}
      <div className="flex justify-end items-center">
        {slides.length > 0 && (
          <Button onClick={saveAll} disabled={anyMissingImage}>
            Save All
          </Button>
        )}
      </div>

      {/* No slides yet */}
      {slides.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No slides yet.</p>
          <Button onClick={addSlide} variant="outline">
            <Plus className="mr-2" /> Add Your First Slide
          </Button>
        </div>
      ) : (
        <>
          {/* Accordion of slides */}
          <Accordion
            type="multiple"
            value={openIds}
            onValueChange={setOpenIds}
            className="space-y-4"
          >
            {slides.map((slide, idx) => (
              <AccordionItem
                key={slide.id}
                value={slide.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3">
                  <AccordionTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 border rounded overflow-hidden bg-white">
                        {slide.imageUrl && (
                          <img
                            src={slide.imageUrl}
                            alt=""
                            className="object-cover w-full h-full"
                          />
                        )}
                      </div>
                      <span className="font-medium">Slide {idx + 1}</span>
                    </div>
                  </AccordionTrigger>
                </div>

                {/* Body */}
                <AccordionContent className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upload area */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer overflow-hidden"
                        onClick={() =>
                          document
                            .getElementById(`file-${slide.id}`)
                            ?.click()
                        }
                      >
                        {slide.imageUrl ? (
                          <img
                            src={slide.imageUrl}
                            alt=""
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <>
                            <UploadCloud className="h-10 w-10" />
                            <p className="mt-2">Click to upload</p>
                          </>
                        )}
                      </div>
                      <input
                        id={`file-${slide.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = await uploadFile(file)
                          updateSlide(slide.id, { imageUrl: url })
                        }}
                      />
                      <p className="mt-2 text-sm text-gray-400">
                        Recommended: 1200×600px
                      </p>
                    </div>

                    {/* Text fields + order + delete */}
                    <div className="space-y-4">
                      <Input
                        placeholder="Headline (optional)"
                        value={slide.headline || ''}
                        onChange={(e) =>
                          updateSlide(slide.id, { headline: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Subheadline (optional)"
                        value={slide.subheadline || ''}
                        onChange={(e) =>
                          updateSlide(slide.id, {
                            subheadline: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Button Text (optional)"
                        value={slide.ctaText || ''}
                        onChange={(e) =>
                          updateSlide(slide.id, { ctaText: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Button URL (optional)"
                        value={slide.ctaUrl || ''}
                        onChange={(e) =>
                          updateSlide(slide.id, { ctaUrl: e.target.value })
                        }
                      />

                      {/* Order + Delete */}
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min={0}
                          className="w-24"
                          value={slide.order}
                          onChange={(e) =>
                            updateSlide(slide.id, {
                              order: Math.max(0, +e.target.value),
                            })
                          }
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(slide.id)}
                        >
                          <Trash2 className="mr-2" /> Delete Slide
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Add another */}
          <div className="pt-4">
            <Button variant="outline" onClick={addSlide}>
              <Plus className="mr-2" /> Add New Slide
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
