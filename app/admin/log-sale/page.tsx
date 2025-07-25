import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import OfflineSaleForm from "./OfflineSaleForm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function LogOfflineSalePage() {
  // 1. Read the NextAuth session on the server
  const session = await getServerSession(authOptions);

  // 2. If no session or no email, send to your custom admin login,
  //    with callback back to this page once they authenticate.
  if (!session?.user?.email) {
    const callbackUrl = encodeURIComponent("/admin/log‑sale");
    return redirect(`/admin-login?callbackUrl=${callbackUrl}`);
  }

  // 3. Lookup the staff record by the email in session
  const staff = await prisma.staff.findUnique({
    where: { email: session.user.email },
  });

  // 4. If no matching staff row, bounce back to admin home
  if (!staff) {
    return redirect("/admin");
  }

  // 5. Render your form with the real staff.id (cuid)
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8">Log Offline Sale</h1>
      <OfflineSaleForm staffId={staff.id} />
    </div>
  );
}
