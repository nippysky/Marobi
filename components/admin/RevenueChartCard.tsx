// components/admin/RevenueChartCard.tsx
"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Filter = "Day" | "Month" | "6 Months" | "Year";

// generate some dummy data
const allData: Record<Filter, { label: string; value: number }[]> = {
  Day: Array.from({ length: 7 }).map((_, i) => ({
    label: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
    value: 1000 + Math.random() * 4000,
  })),
  Month: Array.from({ length: 12 }).map((_, i) => ({
    label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    value: 15000 + i * 2000 + Math.random() * 2000,
  })),
  "6 Months": Array.from({ length: 6 }).map((_, i) => ({
    label: ["Mar","Apr","May","Jun","Jul","Aug"][i],
    value: 20000 + i * 3000 + Math.random() * 3000,
  })),
  Year: Array.from({ length: 5 }).map((_, i) => ({
    label: `${2021 + i}`,
    value: 120000 + i * 20000 + Math.random() * 10000,
  })),
};

export default function RevenueChartCard() {
  const [filter, setFilter] = useState<Filter>("Month");
  const data = useMemo(() => allData[filter], [filter]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={filter} onValueChange={v => setFilter(v as Filter)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(allData).map(k => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid stroke="#f0f0f0" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            formatter={val => `₦${(val as number).toLocaleString()}`}
          />
          <Line type="monotone" dataKey="value" stroke="#16a34a" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
