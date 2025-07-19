import { ReactNode }     from "react";
import { redirect }      from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions }     from "@/app/api/auth/[...nextauth]/route";
import AccountSidebar      from "@/components/account/AccountSidebar";
import { Header } from "@/components/shared/header";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <section className="min-h-screen bg-background">
      <Header />
      <div className="xl:px-40 lg:px-20 md:px-10 px-5 py-10 flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-1/4 pb-6 lg:pb-0">
          <AccountSidebar />
        </aside>
        <main className="w-full lg:w-3/4 space-y-8">{children}</main>
      </div>
    </section>
  );
}
