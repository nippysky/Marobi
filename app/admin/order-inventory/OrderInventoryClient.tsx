
"use client";

import React from "react";
import LogOfflineSaleButton from "@/components/admin/LogOfflineSaleButton";
import type { OrderRow } from "@/types/orders";
import OrderTable from "./OrderTable";

interface Props {
  initialData: OrderRow[];
}

export default function OrderInventoryClient({ initialData }: Props) {
  return (
    <div className="py-6 px-3">
      <div className="flex justify-end mb-10 space-x-2">
        {/* CSV Export lives inside OrderTable filter bar */}
        <LogOfflineSaleButton />
      </div>
      <OrderTable initialData={initialData} />
    </div>
  );
}
