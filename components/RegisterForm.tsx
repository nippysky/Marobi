"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    shippingAddress: "",
    billingAddress: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setErrorMessage(error || "Registration failed");
      } else {
        router.push("/account");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Server error. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className="w-full"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="w-full"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            className="w-full"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+234 801 234 5678"
            className="w-full"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location (City, Country)
          </label>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Lagos, Nigeria"
            className="w-full"
          />
        </div>
      </div>

      {/* Addresses spanning two columns on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Shipping Address
          </label>
          <Textarea
            name="shippingAddress"
            value={formData.shippingAddress}
            onChange={handleChange}
            placeholder="123 Main St, Lekki Phase 1, Lagos"
            rows={3}
            className="w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Billing Address
          </label>
          <Textarea
            name="billingAddress"
            value={formData.billingAddress}
            onChange={handleChange}
            placeholder="123 Main St, Lekki Phase 1, Lagos"
            rows={3}
            className="w-full"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <p className="text-sm text-red-500 text-center">{errorMessage}</p>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
        <Button type="submit" className="w-full sm:w-auto flex-grow" disabled={submitting}>
          {submitting ? "Registering…" : "Register"}
        </Button>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
          Already have an account?{" "}
          <a href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Log In here
          </a>
        </p>
      </div>
    </form>
  );
}
