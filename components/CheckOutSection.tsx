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

// Dynamically load PaystackButton to avoid SSR window errors
const PaystackButton = dynamic(
  () => import("react-paystack").then((m) => m.PaystackButton),
  { ssr: false }
);

interface CountryData {
  name: string;
  iso2: string;
  callingCodes: string[];
}

interface Props {
  user: User | null;
}

// Helper to wrap label + field
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

// Convert ISO2 to flag emoji
const flagEmoji = (iso2: string) =>
  iso2
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );

export default function CheckoutSection({ user }: Props) {
  // Personal info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");

  // Phone
  const [phoneCode, setPhoneCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Country & State
  const [countryList, setCountryList] = useState<CountryData[]>([]);
  const [country, setCountry] = useState<CountryData | null>(null);
  const [stateList, setStateList] = useState<string[]>([]);
  const [state, setState] = useState("");

  // Address
  const [address, setAddress] = useState("");

  // Cart & totals
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

  // 1️⃣ On mount: fetch countries from countriesnow.space + merge ISO2 & callingCodes
  useEffect(() => {
    Promise.all([
      fetch("https://countriesnow.space/api/v0.1/countries").then((r) =>
        r.json()
      ),
      fetch(
        "https://restcountries.com/v2/all?fields=name,alpha2Code,callingCodes"
      ).then((r) => r.json()),
    ]).then(([cnJson, rcJson]: any[]) => {
      const merged: CountryData[] = cnJson.data.map((c: any) => {
        const rc = (rcJson as any[]).find((r) => r.name === c.country);
        return {
          name: c.country,
          iso2: rc?.alpha2Code ?? "",
          callingCodes: rc?.callingCodes ?? [],
        };
      });
      setCountryList(merged);
      const ng = merged.find((c) => c.name === "Nigeria") ?? null;
      setCountry(ng);
      if (ng?.callingCodes.length) setPhoneCode(`+${ng.callingCodes[0]}`);
    });
  }, []);

  // 2️⃣ On country change: clear old states, fetch new state names, update phoneCode
  useEffect(() => {
    if (!country) {
      setStateList([]);
      return;
    }
    setStateList([]); // clear stale
    setState("");

    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: country.name }),
    })
      .then((r) => r.json())
      .then((json: any) => {
        // extract only the names
        const names: string[] =
          json.data?.states?.map((s: any) => s.name) ?? [];
        setStateList(names);
      })
      .catch(() => {
        setStateList([]);
      });

    if (country.callingCodes.length) {
      setPhoneCode(`+${country.callingCodes[0]}`);
    }
  }, [country]);

  // Build unique phone-code options with flags
  const phoneOptions = useMemo(() => {
    const map = new Map<string, string>(); // code -> iso2
    countryList.forEach((c) => {
      c.callingCodes.forEach((code) => {
        if (!map.has(code)) {
          map.set(code, c.iso2);
        }
      });
    });
    return Array.from(map.entries()).map(([code, iso2]) => ({
      code: `+${code}`,
      iso2,
    }));
  }, [countryList]);

  // Paystack setup
  const PAYSTACK_CONFIG = {
    reference: Date.now().toString(),
    email: email || "user@example.com",
    amount: total * 100,
    publicKey: "pk_test_your_public_key",
  };

  return (
    <section className="px-5 md:px-10 lg:px-20 xl:px-40 py-20">
      {/* Breadcrumb omitted for brevity */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Delivery Information */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-lg border border-gray-200 dark:bg-black dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Delivery Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First / Last */}
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

            {/* Country / State (full-width selects) */}
            <FormField label="Country" htmlFor="country">
              <Select
                value={country?.name}
                onValueChange={(val) => {
                  const sel = countryList.find((c) => c.name === val);
                  if (sel) setCountry(sel);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryList.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="State" htmlFor="state">
              <Select value={state} onValueChange={setState}>
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
                  <SelectTrigger className="w-40 mr-2">
                    <SelectValue placeholder={phoneCode} />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneOptions.map(({ code, iso2 }) => (
                      <SelectItem key={code} value={code}>
                        <span className="mr-1">{flagEmoji(iso2)}</span>
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

            {/* Delivery Address */}
            <FormField
              label="Delivery Address"
              htmlFor="address"
              span2
            >
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
