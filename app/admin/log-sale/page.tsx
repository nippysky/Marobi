import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import OfflineSaleForm from "./OfflineSaleForm";
import { authOptions } from "@/lib/authOptions";

export default async function LogOfflineSalePage() {
  // 1) Check session
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    const cb = encodeURIComponent("/admin/log‑sale");
    return redirect(`/admin-login?callbackUrl=${cb}`);
  }

  // 2) Lookup staff
  const staff = await prisma.staff.findUnique({
    where: { email: session.user.email },
  });
  if (!staff) {
    return redirect("/admin");
  }

  // 3) Render form
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8">Log Offline Sale</h1>
      <OfflineSaleForm staffId={staff.id} />
    </div>
  );
}
