"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaArrowLeftLong } from "react-icons/fa6";

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: call your API to request reset link
    //   if 404 → setError("No account found with that email.")
    //   else:
    router.push(
      `/auth/reset-password?email=${encodeURIComponent(email)}`
    );

    setLoading(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-16 px-6">
      {/* Back to Login */}
      <Link
        href="/auth/login"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FaArrowLeftLong className="mr-2" /> Back to Login
      </Link>

      <h1 className="text-2xl font-semibold mb-8">
        Forgot Password
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            className={`mt-2 w-full ${
              error ? "border-red-500" : ""
            }`}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email}
        >
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}
