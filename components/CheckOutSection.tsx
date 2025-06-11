"use client";

import React, { useState, useEffect, ReactNode, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/lib/store/cartStore";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import type { User } from "@/lib/session";
import type { Product } from "@/lib/products";

// Dynamically import PaystackButton to prevent SSR errors
const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);

interface Country {
  name: string;
  alpha2Code: string;
  callingCodes: string[];
}

interface Props {
  user: User | null;
}

// Simple label+control wrapper
const FormField = ({
  label,
  htmlFor,
  children,
  span2 = false,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  span2?: boolean;
}) => (
  <div className={`${span2 ? "md:col-span-2" : ""} flex flex-col gap-2`}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

export default function CheckoutSection({ user }: Props) {
  // Name & contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneCode, setPhoneCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Location
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [country, setCountry] = useState<Country | null>(null);
  const [stateList, setStateList] = useState<string[]>([]);
  const [state, setState] = useState("");

  // Address
  const [address, setAddress] = useState("");

  // Cart & pricing
  const { currency } = useCurrency();
  const items = useCartStore((s) => s.items) as {
    product: Product;
    color: string;
    size: string;
    quantity: number;
  }[];
  const DELIVERY_FEE = 500;
  const subtotal = items.reduce((sum, item) => {
    const price =
      item.product.isDiscounted && item.product.discountPrices
        ? item.product.discountPrices[currency]
        : item.product.prices[currency];
    return sum + price * item.quantity;
  }, 0);
  const total = subtotal + DELIVERY_FEE;

  // Fetch list of countries on mount
  useEffect(() => {
    fetch(
      "https://restcountries.com/v2/all?fields=name,alpha2Code,callingCodes"
    )
      .then((r) => r.json())
      .then((data: Country[]) => {
        setCountryList(data);
        const ng = data.find((c) => c.alpha2Code === "NG");
        if (ng) setCountry(ng);
      });
  }, []);

  // When country changes: fetch its states + update phone code
  useEffect(() => {
    if (!country) return;

    // Fetch states for selected country
    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: country.name }),
    })
      .then((r) => r.json())
      .then((json: any) => {
        setStateList(json.data.states.map((s: any) => s.name));
        setState("");
      });

    // Update phone code
    if (country.callingCodes.length) {
      setPhoneCode(`+${country.callingCodes[0]}`);
    }
  }, [country]);

  // Build a deduplicated list of all calling codes
  const phoneCodes = useMemo(() => {
    const codes = new Set<string>();
    countryList.forEach((c) =>
      c.callingCodes.forEach((code) => codes.add(`+${code}`))
    );
    return Array.from(codes);
  }, [countryList]);

  // Paystack config
  const PAYSTACK_CONFIG = {
    reference: Date.now().toString(),
    email: email || "user@example.com",
    amount: total * 100,
    publicKey: "pk_test_your_public_key",
  };

  return (
    <section className="px-5 md:px-10 lg:px-20 xl:px-40 py-20">
      {/* Breadcrumb omitted */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Delivery Information */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-lg border border-gray-200 dark:bg-black dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Delivery Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First / Last Name */}
            <FormField label="First Name" htmlFor="firstName">
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
              />
            </FormField>
            <FormField label="Last Name" htmlFor="lastName">
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
              />
            </FormField>

            {/* Country / State (full width selects) */}
            <FormField label="Country" htmlFor="country">
              <Select
                value={country?.alpha2Code}
                onValueChange={(code) => {
                  const sel = countryList.find((c) => c.alpha2Code === code);
                  if (sel) setCountry(sel);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryList.map((c) => (
                    <SelectItem key={c.alpha2Code} value={c.alpha2Code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="State" htmlFor="state">
              <Select
                value={state}
                onValueChange={setState}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {stateList.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Email / Phone */}
            <FormField label="Email Address" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Phone Number" htmlFor="phone">
              <div className="flex">
                <Select
                  value={phoneCode}
                  onValueChange={setPhoneCode}
                >
                  <SelectTrigger className="w-24 mr-2">
                    <SelectValue placeholder={phoneCode} />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="800 000 0000"
                />
              </div>
            </FormField>

            {/* Delivery Address (span full width) */}
            <FormField label="Delivery Address" htmlFor="address" span2>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, apartment, etc."
                rows={4}
              />
            </FormField>
          </div>
        </div>

        {/* Cart & Payment */}
        <div className="space-y-6">
          {/* Your Cart */}
          <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Your Cart
            </h2>
            <ScrollArea className="max-h-64 overflow-y-auto">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => {
                  const unitPrice =
                    item.product.isDiscounted &&
                    item.product.discountPrices
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
                        ×{item.quantity} ×{" "}
                        {formatAmount(unitPrice, currency)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>

          {/* Order Summary & Paystack */}
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
            <PaystackButton
              {...PAYSTACK_CONFIG}
              text="Pay Now With Paystack"
              className="bg-brand rounded-full py-3 w-full mt-5 flex justify-center items-center text-center text-white text-[0.85rem]"
              onBankTransferConfirmationPending={() => {}}
              onClose={() => {}}
              onSuccess={() => {}}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
