import React from "react";
import { getCurrentUser } from "@/lib/session";
import OfflineSaleForm from "./OfflineSaleForm";


export default async function LogOfflineSalePage() {
  const user = await getCurrentUser();
  const staffId = user?.email ?? "dev-staff";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">Log Offline Sale</h1>
      <OfflineSaleForm staffId={staffId} />
    </div>
  );
}
