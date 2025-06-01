import AccountForm from "@/components/AccountForm";
import AuthPrompt from "@/components/AuthPrompt";
import Header from "@/components/shared/header";
import { getCurrentUser } from "@/lib/session";
import React from "react";


export default async function AccountPage() {
  // Fetch the current user on the server. In a real app, getCurrentUser()
  // would check cookies/headers or hit your auth system. Here it returns
  // a mock user (or null if not logged in).
  const user = await getCurrentUser();

  return <section className="flex flex-col lg:px-20 md:px-10 px-5">
    <Header/>
<main className="mt-10">


 {   user ? <AccountForm user={user} /> : <AuthPrompt />}
</main>
  </section> 
}

    
