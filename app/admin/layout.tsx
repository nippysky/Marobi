import AdminSidebar from "@/components/admin/AdminSidebar";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

const COOKIE_NAME = "marobi_session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1) Read all cookies
  const cookieStore = await cookies();
  // 2) Build a single "cookie" header string
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  // 3) Pull the NextAuth token out of that header
  const token = await getToken({
    req: { headers: { cookie: cookieHeader } } as any,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: COOKIE_NAME,
  });

  // 4) If there's no token, or it's a "customer" session, kick to admin login
  if (!token || token.role === "customer") {
    redirect("/admin/login");
  }

  // 5) Otherwise render the admin UI
  return <AdminSidebar>{children}</AdminSidebar>;
}
