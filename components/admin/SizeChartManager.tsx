// components/admin/SizeChartManager.tsx
'use client'
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import toast from "react-hot-toast"

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
  name: string
  entries: Entry[]
}

export default function SizeChartManager({ initialChart }: { initialChart: Chart }) {
  const [chartName, setChartName] = useState(initialChart.name)
  const [entries, setEntries]     = useState<Entry[]>(initialChart.entries)

  function updateEntry(idx: number, field: keyof Entry, val: string) {
    setEntries(e => {
      const c = [...e]
      // @ts-ignore
      c[idx][field] = field.includes("Min")||field.includes("Max") ? +val : val
      return c
    })
  }

  function addEntry() {
    setEntries(e => [...e, {
      id: "",
      sizeLabel: "",
      chestMin: 0, chestMax: 0,
      waistMin: 0, waistMax: 0
    }])
  }

  async function save() {
    try {
      await fetch("/api/store-settings/size-chart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialChart.id, name: chartName, entries })
      })
      toast.success("Size chart saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input value={chartName} onChange={e => setChartName(e.target.value)} />
      </div>

      <div className="overflow-auto">
        <table className="w-full table-auto border">
          <thead>
            <tr>
              {["Size","Chest Min","Chest Max","Waist Min","Waist Max",""].map(h => (
                <th key={h} className="border px-2 py-1 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((ent, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">
                  <Input
                    value={ent.sizeLabel}
                    onChange={e => updateEntry(i, "sizeLabel", e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <Input
                    type="number"
                    value={ent.chestMin}
                    onChange={e => updateEntry(i, "chestMin", e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <Input
                    type="number"
                    value={ent.chestMax}
                    onChange={e => updateEntry(i, "chestMax", e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <Input
                    type="number"
                    value={ent.waistMin}
                    onChange={e => updateEntry(i, "waistMin", e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <Input
                    type="number"
                    value={ent.waistMax}
                    onChange={e => updateEntry(i, "waistMax", e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <button onClick={() => setEntries(e => e.filter((_, j) => j !== i))}>
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus /> Add Row
        </Button>
        <Button onClick={save}>Save Size Chart</Button>
      </div>
    </div>
)
}
