
import React from "react";
import { Header } from "@/components/shared/header";
import { getCurrentUser, type User } from "@/lib/session";
import CheckoutContent from "@/components/CheckOutContent";


export default async function CheckoutPage() {
  const user: User | null = await getCurrentUser();

  return (
    <section className="min-h-screen flex flex-col bg-background">
      <Header />
      <CheckoutContent user={user} />
    </section>
  );
}
