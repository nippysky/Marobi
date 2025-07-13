// components/admin/SizeChartManager.tsx
'use client'

import React, { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import BackButton from '../BackButton'

interface Entry {
  id: string
  sizeLabel: string
  chestMin: number
  chestMax: number
  waistMin: number
  waistMax: number
}

interface Chart {
  id: string
  entries: Entry[]
}

export default function SizeChartManager({ initialChart }: { initialChart: Chart }) {
  const [entries, setEntries] = useState<Entry[]>(initialChart.entries)

  // Update a single field, clamping numbers ≥ 0
  const updateEntry = (idx: number, field: keyof Entry, raw: string) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === idx
          ? {
              ...e,
              [field]:
                field === 'sizeLabel'
                  ? raw
                  : Math.max(0, Number(raw)),
            }
          : e
      )
    )
  }

  // Remove a row
  const removeRow = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx))
  }

  // Add a fresh row
  const addRow = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: uuid(),
        sizeLabel: '',
        chestMin: 0,
        chestMax: 0,
        waistMin: 0,
        waistMax: 0,
      },
    ])
  }

  // Every entry must have a non‐empty label and min ≤ max
  const allValid = entries.every(
    (e) =>
      e.sizeLabel.trim() !== '' &&
      e.chestMin <= e.chestMax &&
      e.waistMin <= e.waistMax
  )

  // Persist to the backend
  async function saveChart() {
    if (!allValid) return
    try {
      await fetch('/api/store-settings/size-chart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initialChart.id, entries }),
      })
      toast.success('Size chart saved')
    } catch {
      toast.error('Failed to save size chart')
    }
  }

  return (
    <div className="space-y-6">
          <BackButton />

          
      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No size chart entries.</p>
          <Button variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Row
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-auto">
            <table className="w-full table-auto border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Size</th>
                  <th className="border px-3 py-2 text-left">Chest Min</th>
                  <th className="border px-3 py-2 text-left">Chest Max</th>
                  <th className="border px-3 py-2 text-left">Waist Min</th>
                  <th className="border px-3 py-2 text-left">Waist Max</th>
                  <th className="border px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id} className="even:bg-gray-50">
                    <td className="border px-2 py-1">
                      <Input
                        value={e.sizeLabel}
                        placeholder="e.g. M"
                        onChange={(ev) => updateEntry(i, 'sizeLabel', ev.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        min={0}
                        value={e.chestMin}
                        onChange={(ev) => updateEntry(i, 'chestMin', ev.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        min={e.chestMin}
                        value={e.chestMax}
                        onChange={(ev) => updateEntry(i, 'chestMax', ev.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        min={0}
                        value={e.waistMin}
                        onChange={(ev) => updateEntry(i, 'waistMin', ev.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Input
                        type="number"
                        min={e.waistMin}
                        value={e.waistMax}
                        onChange={(ev) => updateEntry(i, 'waistMax', ev.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeRow(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
            <Button onClick={saveChart} disabled={!allValid}>
              Save Size Chart
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
