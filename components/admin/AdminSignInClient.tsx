"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function AdminSignInClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const id = toast.loading("Signing in…");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: "staff",
      });
      if (res?.error) {
        toast.error(res.error, { id });
        setLoading(false);
      } else {
        toast.success("Welcome back!", { id });
        setTimeout(() => router.replace("/admin"), 600);
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed", { id });
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
               <ArrowLeft className="mr-1 h-4 w-4" /> Back to Site
          </Link>

          <h1 className="text-3xl font-bold mb-8 text-center">
            Admin / Staff Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="mt-2 w-full"
              />
            </div>

            <div>
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative mt-2">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <Link
                href="/admin-login/forgot-password"
                className="text-gray-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in as Staff"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
