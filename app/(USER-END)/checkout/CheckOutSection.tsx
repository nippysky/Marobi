"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
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
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import { Toaster, toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import type { CheckoutUser } from "./page";
import OrderSuccessModal from "@/components/OrderSuccessModal";
import {
  useCheckout,
  CartItemPayload,
  CustomerPayload,
} from "@/lib/hooks/useCheckout";

const PaystackButton = dynamic(
  () => import("react-paystack").then((m) => m.PaystackButton),
  { ssr: false }
);

interface CountryData {
  name: string;
  iso2: string;
  callingCodes: string[];
}

interface DeliveryOption {
  id: string;
  name: string;
  provider?: string | null;
  type: "COURIER" | "PICKUP";
  baseFee: number;
  active: boolean;
  metadata?: any;
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
  const { data: session } = useSession();
  const { currency } = useCurrency();
  const items = useCartStore((s) => s.items) as CartItem[];
  const clearCart = useCartStore((s) => s.clear) as () => void;
  const totalWeight = useCartStore((s) => s.totalWeight()) || 0;

  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] =
    useState<DeliveryOption | null>(null);

  const { isProcessing, error, result, createOrder, reset } = useCheckout();

  // Prefill
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

  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState(
    user?.billingAddress ?? ""
  );

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerEmailForModal, setCustomerEmailForModal] =
    useState<string>("");

  // Payment reference retention for retry
  const [lastPaymentReference, setLastPaymentReference] = useState<string | null>(
    null
  );
  const [orderCreatingFromReference, setOrderCreatingFromReference] =
    useState(false);

  // Load countries
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
        console.error("loadCountries error:", err);
        setCountryList([]);
        toast.error("Could not load country list.");
      }
    }
    loadCountries();
  }, [user?.country]);

  // Load states
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
        console.error("loadStates error:", err);
        setStateList([]);
        toast.error("Could not load states.");
      }
      if (country?.callingCodes?.length) {
        setPhoneCode(`+${country.callingCodes[0]}`);
      }
    }
    loadStates();
  }, [country]);

  // Fetch delivery options
  useEffect(() => {
    async function loadOptions() {
      if (!country) return;
      try {
        const res = await fetch(
          `/api/delivery-options?country=${encodeURIComponent(country.name)}`
        );
        if (!res.ok) throw new Error("Failed to load delivery options");
        const data: DeliveryOption[] = await res.json();
        const activeOptions = data.filter((o) => o.active);
        setDeliveryOptions(activeOptions);
        setSelectedDeliveryOption(
          (prev) =>
            (prev && activeOptions.find((o) => o.id === prev.id)) ??
            activeOptions[0] ??
            null
        );
      } catch (err) {
        console.error("load delivery options:", err);
        toast.error("Could not load delivery options.");
      }
    }
    loadOptions();
  }, [country]);

  // Phone code options
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

  // Totals
  const itemsSubtotal = useMemo(
    () =>
      items.reduce(
        (sum: number, item: CartItem) =>
          sum + (item.price - item.sizeModFee) * item.quantity,
        0
      ),
    [items]
  );
  const sizeModTotal = useMemo(
    () =>
      items.reduce(
        (sum: number, item: CartItem) => sum + item.sizeModFee * item.quantity,
        0
      ),
    [items]
  );
  const deliveryFee = selectedDeliveryOption?.baseFee ?? 0;
  const total = itemsSubtotal + sizeModTotal + deliveryFee;

  // Readiness
  const isPaymentReady =
    email.trim() !== "" &&
    items.length > 0 &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    deliveryAddress.trim() !== "" &&
    selectedDeliveryOption !== null;

  const amountInLowestDenomination = Math.round(total * 100);

  // Paystack public key (must be string for props)
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;
  if (!paystackPublicKey) {
    console.error(
      "Missing NEXT_PUBLIC_PAYSTACK_KEY; Paystack payment will be disabled."
    );
  }
  const safePaystackPublicKey = paystackPublicKey || ""; // ensure string

  // Paystack reference for idempotency
  const [paystackReference, setPaystackReference] = useState<string>(
    `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );

  // regenerate when appropriate
  useEffect(() => {
    if (!isProcessing && !orderCreatingFromReference) {
      setPaystackReference(
        `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, email]);

  const paystackConfig = useMemo(
    () => ({
      reference: paystackReference,
      email,
      amount: amountInLowestDenomination,
      publicKey: safePaystackPublicKey,
    }),
    [paystackReference, email, amountInLowestDenomination, safePaystackPublicKey]
  );

  const customerPayload: CustomerPayload = {
    firstName,
    lastName,
    email,
    phone: `${phoneCode}${phoneNumber}`,
    deliveryAddress,
    billingAddress: billingSame ? deliveryAddress : billingAddress,
    country: country?.name,
    state,
    ...(session?.user?.id ? { id: session.user.id } : {}),
  };

  const buildCartItemsPayload = useCallback((): CartItemPayload[] => {
    return items.map((it: any) => ({
      productId: it.product.id,
      color: it.color || "N/A",
      size: it.size || "N/A",
      quantity: it.quantity,
      hasSizeMod: !!it.hasSizeMod,
      sizeModFee: it.sizeModFee || 0,
      unitWeight: it.unitWeight ?? 0,
    }));
  }, [items]);

  const handlePaystackSuccess = async (reference: any) => {
    try {
      if (isProcessing || orderCreatingFromReference) return;

      const refString =
        reference?.reference || reference?.ref || paystackReference || "";
      if (!refString) {
        toast.error("Could not determine payment reference.");
        return;
      }

      setLastPaymentReference(refString);
      setOrderCreatingFromReference(true);

      const cartItems = buildCartItemsPayload();

      const order = await createOrder({
        items: cartItems,
        customer: customerPayload,
        paymentMethod: "Paystack",
        currency: currency.toUpperCase(),
        deliveryFee,
        timestamp: new Date().toISOString(),
        deliveryOptionId: selectedDeliveryOption?.id,
        paymentReference: refString,
      });

      if (!order) {
        toast.error(
          "Order creation failed after payment. We'll keep the payment reference so you can retry."
        );
        setOrderCreatingFromReference(false);
        return;
      }

      setCustomerEmailForModal(order.email);
      toast.success("Order created successfully.");
      setOrderCreatingFromReference(false);
    } catch (err: any) {
      console.error("Order creation after payment failed:", err);
      toast.error(err?.message || "Something went wrong creating your order.");
      setOrderCreatingFromReference(false);
    }
  };

  const retryOrderCreation = async () => {
    if (!lastPaymentReference) return;
    if (isProcessing || orderCreatingFromReference) return;

    setOrderCreatingFromReference(true);
    try {
      const cartItems = buildCartItemsPayload();

      const order = await createOrder({
        items: cartItems,
        customer: customerPayload,
        paymentMethod: "Paystack",
        currency: currency.toUpperCase(),
        deliveryFee,
        timestamp: new Date().toISOString(),
        deliveryOptionId: selectedDeliveryOption?.id,
        paymentReference: lastPaymentReference,
      });

      if (!order) {
        toast.error("Retry failed. Please contact support.");
        setOrderCreatingFromReference(false);
        return;
      }

      setCustomerEmailForModal(order.email);
      toast.success("Order created successfully on retry.");
    } catch (err: any) {
      console.error("Retry order creation error:", err);
      toast.error("Retry failed. Please contact support.");
    } finally {
      setOrderCreatingFromReference(false);
    }
  };

  useEffect(() => {
    if (result?.orderId) {
      setCustomerEmailForModal(result.email);
      setShowSuccess(true);
    }
  }, [result]);

  const paymentDisabled =
    !isPaymentReady || isProcessing || orderCreatingFromReference;

  return (
    <>
      <Toaster position="top-right" />

      <section className="px-5 md:px-10 lg:px-20 xl:px-40 py-20">
        {/* ... UI omitted for brevity (same as before) ... */}
        {/* Payment button area */}
        <div className="mt-6">
          {!isPaymentReady ? (
            <Button disabled className="w-full py-3 rounded-full">
              Complete required fields
            </Button>
          ) : (
            <div className="space-y-2">
              <PaystackButton
                {...paystackConfig}
                text={
                  isProcessing || orderCreatingFromReference
                    ? "Finalizing order..."
                    : `Pay ${formatAmount(total, currency)}`
                }
                onSuccess={handlePaystackSuccess}
                onClose={() => {
                  toast.error("Payment cancelled. Please try again.");
                }}
                className="w-full py-3 rounded-full bg-brand text-white font-medium disabled:opacity-60"
                disabled={paymentDisabled || !safePaystackPublicKey}
              />
              {orderCreatingFromReference &&
                lastPaymentReference &&
                !result?.orderId && (
                  <div className="text-center text-sm">
                    Payment succeeded with reference{" "}
                    <code>{lastPaymentReference}</code>, creating order...
                  </div>
                )}
              {!orderCreatingFromReference &&
                lastPaymentReference &&
                !result?.orderId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={retryOrderCreation}
                    disabled={isProcessing}
                  >
                    Retry Order Creation
                  </Button>
                )}
              {isProcessing && (
                <p className="mt-2 text-center text-sm text-gray-600">
                  We’re confirming your order. This should take a moment.
                </p>
              )}
              {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
              )}
            </div>
          )}
        </div>
      </section>

      <OrderSuccessModal
        open={showSuccess}
        orderId={result?.orderId || ""}
        email={customerEmailForModal || result?.email || email}
        onClose={() => {
          setShowSuccess(false);
          try {
            clearCart();
          } catch {}
          reset();
          router.push("/all-products");
        }}
      />
    </>
  );
}
