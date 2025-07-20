"use client";

import React from "react";
import LogOfflineSaleButton from "@/components/admin/LogOfflineSaleButton";
import OrderTable from "./OrderTable";
import type { OrderRow } from "@/types/orders";

interface Props {
  initialData: OrderRow[];
}

export default function OrderInventoryClient({ initialData }: Props) {
  return (
    <div className="py-6 px-3">
      <div className="flex justify-end mb-10">
        <LogOfflineSaleButton />
      </div>
      <OrderTable initialData={initialData} />
    </div>
  );
}
