"use client";

import React, { useState, useEffect, useMemo, ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useCartStore } from "@/lib/store/cartStore";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import { Toaster, toast } from "react-hot-toast";
import type { CheckoutUser } from "./page";

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
  user: CheckoutUser | null;
}

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

const flagEmoji = (iso2: string) =>
  iso2
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );

export default function CheckoutSection({ user }: Props) {
  const router = useRouter();
  const { currency } = useCurrency();
  const items = useCartStore((s) => s.items);
  const DELIVERY_FEE = 500;

  // Prefill from user when available
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneCode, setPhoneCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [countryList, setCountryList] = useState<CountryData[]>([]);
  const [country, setCountry] = useState<CountryData | null>(null);
  const [stateList, setStateList] = useState<string[]>([]);
  const [state, setState] = useState(user?.state ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.deliveryAddress ?? ""
  );

  // Billing address toggle
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState(
    user?.billingAddress ?? ""
  );

  // Load countries & calling codes
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch("/api/utils/countries");
        if (!res.ok) throw new Error("Failed to fetch countries");
        const data: CountryData[] = await res.json();
        setCountryList(data);
        const defaultCountry =
          data.find((c) => c.name === user?.country) ??
          data.find((c) => c.name === "Nigeria") ??
          null;
        setCountry(defaultCountry);
        if (defaultCountry?.callingCodes.length) {
          setPhoneCode(`+${defaultCountry.callingCodes[0]}`);
        }
      } catch (err) {
        console.error(err);
        setCountryList([]);
        toast.error("Could not load country list.");
      }
    }
    loadCountries();
  }, [user?.country]);

  // Load states for selected country
  useEffect(() => {
    async function loadStates() {
      if (!country) {
        setStateList([]);
        return;
      }
      setStateList([]);
      setState("");
      try {
        const res = await fetch("/api/utils/states", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: country.name }),
        });
        if (!res.ok) throw new Error("Failed to fetch states");
        const json = await res.json();
        setStateList(json.states ?? []);
      } catch (err) {
        console.error(err);
        setStateList([]);
        toast.error("Could not load states.");
      }
      if (country.callingCodes.length) {
        setPhoneCode(`+${country.callingCodes[0]}`);
      }
    }
    loadStates();
  }, [country]);

  const phoneOptions = useMemo(() => {
    const map = new Map<string, string>();
    countryList.forEach((c) =>
      c.callingCodes.forEach((code) => {
        if (!map.has(code)) map.set(code, c.iso2);
      })
    );
    return Array.from(map.entries()).map(([code, iso2]) => ({
      code: `+${code}`,
      iso2,
    }));
  }, [countryList]);

  // Totals, including 5% size‑mod fee already in item.price
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + (item.price - item.sizeModFee) * item.quantity,
    0
  );
  const sizeModTotal = items.reduce(
    (sum, item) => sum + item.sizeModFee * item.quantity,
    0
  );
  const total = itemsSubtotal + sizeModTotal + DELIVERY_FEE;

  const PAYSTACK_CONFIG = {
    reference: Date.now().toString(),
    email: email || "user@example.com",
    amount: total * 100,
    publicKey: "pk_test_your_public_key",
  };

  return (
    <>
      <Toaster position="top-right" />
      <section className="px-5 md:px-10 lg:px-20 xl:px-40 py-20">
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          /{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Checkout
          </span>
        </nav>
        <Button
          variant="link"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <FaArrowLeftLong /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery & Billing */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Delivery Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="First Name" htmlFor="firstName">
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </FormField>
                <FormField label="Last Name" htmlFor="lastName">
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </FormField>
                <FormField label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormField>
                <FormField label="Phone Number" htmlFor="phone">
                  <div className="flex">
                    <Select
                      value={phoneCode}
                      onValueChange={setPhoneCode}
                    >
                      <SelectTrigger className="w-32 mr-2">
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
                    />
                  </div>
                </FormField>
                <FormField label="Country" htmlFor="country">
                  {countryList.length === 0 ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
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
                  )}
                </FormField>
                <FormField label="State" htmlFor="state">
                  {country && stateList.length === 0 ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
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
                  )}
                </FormField>
                <FormField
                  label="Delivery Address"
                  htmlFor="deliveryAddress"
                  span2
                >
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                  />
                </FormField>
              </div>
            </div>

            {/* Billing Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
              <div className="flex items-center mb-4">
                <input
                  id="sameBilling"
                  type="checkbox"
                  checked={billingSame}
                  onChange={() => setBillingSame(!billingSame)}
                  className="mr-2"
                />
                <label htmlFor="sameBilling" className="font-medium">
                  Billing same as delivery
                </label>
              </div>
              {!billingSame && (
                <FormField
                  label="Billing Address"
                  htmlFor="billingAddress"
                  span2
                >
                  <Textarea
                    id="billingAddress"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={3}
                  />
                </FormField>
              )}
            </div>
          </div>

          {/* Cart Summary + Order Summary */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Your Cart</h2>
              <ScrollArea className="max-h-48">
                <ul className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <li
                      key={`${item.product.id}-${item.color}-${item.size}-${idx}`}
                      className="py-3 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        {item.product.images[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-12 h-12 rounded object-cover border"
                          />
                        )}
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.color}, {item.size}
                          </p>
                          {item.hasSizeMod && (
                            <p className="text-xs text-yellow-600">
                              +5% fee
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatAmount(item.price * item.quantity, currency)}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>{formatAmount(itemsSubtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size Mods (5%):</span>
                  <span>{formatAmount(sizeModTotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatAmount(DELIVERY_FEE, currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatAmount(total, currency)}</span>
                </div>
              </div>
              <PaystackButton
                {...PAYSTACK_CONFIG}
                text="Pay Now With Paystack"
                className="mt-6 w-full py-3 rounded-full bg-brand text-white font-medium"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
