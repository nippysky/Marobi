"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // If you have a Textarea component; otherwise use a styled <textarea>
import { User } from "@/lib/session";


interface AccountFormProps {
  user: User;
}

export default function AccountForm({ user }: AccountFormProps) {
  // Prefill each field with the server‐passed user data:
  const [fullName, setFullName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [location, setLocation] = useState(user.location || "");
  const [shippingAddress, setShippingAddress] = useState(user.shippingAddress || "");
  const [billingAddress, setBillingAddress] = useState(user.billingAddress || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Call your API route to save account info. Replace the URL with your real endpoint.
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          location,
          shippingAddress,
          billingAddress,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setSaveMessage("Your details have been updated.");
    } catch (err) {
      console.error(err);
      setSaveMessage("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Account Information
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Two‐column grid on md+, one‐column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lagos, Nigeria"
              className="w-full"
            />
          </div>

          {/* Shipping Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shipping Address
            </label>
            <Textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="123 Main St, Lekki Phase 1, Lagos"
              rows={3}
              className="w-full"
            />
          </div>

          {/* Billing Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Billing Address
            </label>
            <Textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="123 Main St, Lekki Phase 1, Lagos"
              rows={3}
              className="w-full"
            />
          </div>
        </div>

        {/* Save Button + feedback */}
        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          {saveMessage && (
            <p
              className={`text-sm ${
                saveMessage.includes("error")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {saveMessage}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
