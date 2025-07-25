import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import AdminSignInClient from "@/components/admin/AdminSignInClient";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminLoginPage() {
  // server‑side: check for an existing session
  const session = await getServerSession(authOptions);

  // if we have a session and it's *not* a customer, send them to /admin
  if (session && session.user.role !== "customer") {
    redirect("/admin");
  }

  // otherwise render the client‑side login form
  return <AdminSignInClient />;
}
