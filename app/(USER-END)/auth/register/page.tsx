import RegisterForm from "@/components/RegisterForm";
import Header from "@/components/shared/header";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

export default function RegisterPage() {
  return (
    <section className="flex flex-col lg:px-20 md:px-10 px-5">
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full lg:max-w-[50rem] bg-white dark:bg-gray-800 p-0">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Create a New Account
            </h1>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
