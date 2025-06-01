import Header from "@/components/shared/header";
import LoginForm from "@/components/LoginForm";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

export default function LoginPage() {
  return (
    <section className="flex flex-col lg:px-20 md:px-10 px-5">
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md lg:max-w-xl bg-white dark:bg-gray-800 p-0">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Log In to Your Account
            </h1>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
