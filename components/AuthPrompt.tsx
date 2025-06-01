import React from "react";
import Link from "next/link";

export default function AuthPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
          Please Log In or Register
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
          You need an account to view and edit your billing information.
        </p>
        <div className="flex flex-col space-y-4">
          <Link href="/auth/login" className="block w-full text-center py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      
              Log In
     
          </Link>
          <Link href="/auth/register" className="block w-full text-center py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
     
              Register

          </Link>
        </div>
      </div>
    </div>
  );
}
