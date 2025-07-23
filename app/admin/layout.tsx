import AdminShell from "@/components/admin/AdminShell";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1️⃣ server-side session check
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "customer") {
    // not logged in as staff/admin → redirect
    redirect("/admin-login");
  }

  // 2️⃣ logged in → render the client shell
  return <AdminShell>{children}</AdminShell>;
}
