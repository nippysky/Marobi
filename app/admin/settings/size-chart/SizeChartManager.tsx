'use client';

import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

interface Entry {
  id: string;
  sizeLabel: string;
  chestMin: number;
  chestMax: number;
  waistMin: number;
  waistMax: number;
  hipMin: number;
  hipMax: number;  
}

interface Chart {
  id: string;
  entries: Entry[];
}

export default function SizeChartManager({
  initialChart,
}: {
  initialChart: Chart;
}) {
  const [entries, setEntries] = useState<Entry[]>(initialChart.entries);
  const [isSaving, setIsSaving] = useState(false);

  // Update a single field, clamping numbers ≥ 0
  const updateEntry = (
    idx: number,
    field: keyof Entry,
    raw: string
  ) => {
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
    );
  };

  // Locally remove a row
  const removeRow = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

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
        hipMin: 0,
        hipMax: 0,
      },
    ]);
  };

  // Validation: non‐empty label and min ≤ max
  const allValid = entries.every(
    (e) =>
      e.sizeLabel.trim() !== '' &&
      e.chestMin <= e.chestMax &&
      e.waistMin <= e.waistMax &&
      e.hipMin <= e.hipMax    
  );

  // Persist to the backend with loading indication
  async function saveChart() {
    if (!allValid || isSaving) return;
    setIsSaving(true);
    const toastId = toast.loading('Saving size chart...');
    try {
      const res = await fetch('/api/store-settings/size-chart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initialChart.id, entries }),
      });
      if (!res.ok) throw new Error();
      toast.success('Size chart saved', { id: toastId });
    } catch {
      toast.error('Failed to save size chart', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="mb-4">No size chart entries.</p>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-800 hover:border-brand hover:text-brand"
            onClick={addRow}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Row
          </Button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
     <thead className="bg-gray-100">
  <tr>
    {[
      'Size',
      'Bust/Chest Min',
      'Bust/Chest Max',
      'Waist Min',
      'Waist Max',
      'Hip Min',
      'Hip Max',
      'Actions',
    ].map((h) => (
      <th
        key={h}
        className="px-4 py-2 text-left text-sm font-medium text-gray-700"
      >
        {h}
      </th>
    ))}
  </tr>
</thead>
<tbody className="divide-y divide-gray-200">
  {entries.map((e, i) => (
    <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
        <Input
          value={e.sizeLabel}
          placeholder="e.g. M"
          onChange={(ev) => updateEntry(i, 'sizeLabel', ev.target.value)}
          className="w-full border-gray-300 focus:border-brand focus:ring-brand"
        />
      </td>
      {/* CHEST MIN */}
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
        <Input
          type="number"
          min={0}
          value={e.chestMin}
          onChange={(ev) => updateEntry(i, 'chestMin', ev.target.value)}
          className="w-full border-gray-300 focus:border-brand focus:ring-brand"
        />
      </td>
      {/* CHEST MAX */}
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
        <Input
          type="number"
          min={e.chestMin}
          value={e.chestMax}
          onChange={(ev) => updateEntry(i, 'chestMax', ev.target.value)}
          className="w-full border-gray-300 focus:border-brand focus:ring-brand"
        />
      </td>
      {/* WAIST MIN */}
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
        <Input
          type="number"
          min={0}
          value={e.waistMin}
          onChange={(ev) => updateEntry(i, 'waistMin', ev.target.value)}
          className="w-full border-gray-300 focus:border-brand focus:ring-brand"
        />
      </td>
      {/* WAIST MAX */}
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
        <Input
          type="number"
          min={e.waistMin}
          value={e.waistMax}
          onChange={(ev) => updateEntry(i, 'waistMax', ev.target.value)}
          className="w-full border-gray-300 focus:border-brand focus:ring-brand"
        />
      </td>
      {/* HIP MIN */}
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
        <Input
          type="number"
          min={0}
          value={e.hipMin}
          onChange={(ev) => updateEntry(i, 'hipMin', ev.target.value)}
          className="w-full border-gray-300 focus:border-brand focus:ring-brand"
        />
      </td>
      {/* HIP MAX */}
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
        <Input
          type="number"
          min={e.hipMin}
          value={e.hipMax}
          onChange={(ev) => updateEntry(i, 'hipMax', ev.target.value)}
          className="w-full border-gray-300 focus:border-brand focus:ring-brand"
        />
      </td>
      <td className="px-4 py-2 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-brand"
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

          {/* Controls */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-800 hover:border-brand hover:text-brand"
              onClick={addRow}
              disabled={isSaving}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
            <Button
              onClick={saveChart}
              disabled={!allValid || isSaving}
              className="bg-brand text-white hover:bg-brand/90 disabled:opacity-50 flex items-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Size Chart'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
