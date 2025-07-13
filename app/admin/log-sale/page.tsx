import React from "react";
import { getCurrentUser } from "@/lib/session";
import OfflineSaleForm from "@/components/admin/OfflineSaleForm";


export default async function LogOfflineSalePage() {
  const user = await getCurrentUser();
  // use their email (or any unique field) as staffId in dev
  const staffId = user?.email ?? "dev-staff";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Log Offline Sale</h1>
      <OfflineSaleForm staffId={staffId} />
    </div>
  );
}
