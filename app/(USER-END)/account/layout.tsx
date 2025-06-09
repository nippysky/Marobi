import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Header } from "@/components/shared/header";
import AccountSidebar from "@/components/account/AccountSidebar";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <section className="min-h-screen bg-background">
      <Header />

      <div className="xl:px-40 lg:px-20 md:px-10 px-5 py-10 flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full lg:w-1/4 pb-6 lg:pb-0">
          <AccountSidebar />
        </aside>

        {/* Main content */}
        <main className="w-full lg:w-3/4 space-y-8">{children}</main>
      </div>
    </section>
  );
}
