// components/checkout/CheckoutSection.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCartStore } from "@/lib/store/cartStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import type { User } from "@/lib/session";
import type { Product } from "@/lib/products";

interface Props {
  user: User | null;
}

interface CartItem {
  product: Product;
  color: string;
  size: string;
  quantity: number;
}

export default function CheckoutSection({ user }: Props) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");

  const { currency } = useCurrency();
  const items = useCartStore((s) => s.items) as CartItem[];

  const DELIVERY_FEE = 500;
  const subtotal = items.reduce((sum, item) => {
    const price =
      item.product.isDiscounted && item.product.discountPrices
        ? item.product.discountPrices[currency]
        : item.product.prices[currency];
    return sum + price * item.quantity;
  }, 0);
  const total = subtotal + DELIVERY_FEE;

  return (
    <div className="px-5 md:px-10 lg:px-20 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          Checkout
        </span>
      </nav>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Delivery form */}
        <div className="lg:col-span-2 space-y-6 bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Delivery Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
              <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
               <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
              />
            </div>
              <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State, Country"
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, apartment, etc."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Cart & Payment */}
        <div className="space-y-6">
          {/* Cart items */}
          <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Your Cart
            </h2>
            <ScrollArea className="max-h-64 overflow-y-auto">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => {
                  const unitPrice =
                    item.product.isDiscounted && item.product.discountPrices
                      ? item.product.discountPrices[currency]
                      : item.product.prices[currency];
                  return (
                    <li
                      key={`${item.product.id}-${item.color}-${item.size}`}
                      className="py-2 flex justify-between items-start"
                    >
                      <div>
                        <Link
                          href={`/product/${item.product.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.color}, {item.size}
                        </p>
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        ×{item.quantity} &times;{" "}
                        {formatAmount(unitPrice, currency)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>

          {/* Payment summary & Paystack */}
          <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{formatAmount(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{formatAmount(DELIVERY_FEE, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatAmount(total, currency)}</span>
              </div>
            </div>
            <Button
              className="w-full mt-6"
              onClick={() => {
                /* TODO: Paystack integration */
              }}
            >
              Pay with Paystack
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
