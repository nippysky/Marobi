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

import {
  useCountryState,
  useDeliveryOptions,
  useCartTotals,
} from "@/lib/hooks/useCheckoutForm";

const PaystackButton = dynamic(
  () => import("react-paystack").then((m) => m.PaystackButton),
  { ssr: false }
);

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
  (iso2 || "")
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );

export default function CheckoutSection({ user }: Props) {
  const router = useRouter();
  const { data: session } = useSession({ required: false });
  const { currency } = useCurrency();

  const items = useCartStore((s) => s.items) as CartItem[];
  const clearCart = useCartStore((s) => s.clear) as () => void;

  const { itemsSubtotal, sizeModTotal, totalWeight, total: baseTotal } =
    useCartTotals(
      items.map((it) => ({
        price: it.price,
        sizeModFee: it.sizeModFee,
        quantity: it.quantity,
        unitWeight: it.unitWeight,
      }))
    );

  const {
    countryList,
    country,
    setCountry,
    stateList,
    state,
    setState,
    phoneCode,
    setPhoneCode,
    phoneOptions,
  } = useCountryState(user?.country, user?.state);

  const {
    deliveryOptions,
    selectedDeliveryOption,
    setSelectedDeliveryOption,
    deliveryFee,
  } = useDeliveryOptions(country?.name);

  const total = baseTotal + deliveryFee;

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.deliveryAddress ?? ""
  );
  const [billingSame, setBillingSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState(
    user?.billingAddress ?? ""
  );

  const [hasAttemptedPayment, setHasAttemptedPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerEmailForModal, setCustomerEmailForModal] =
    useState<string>("");
  const [lastPaymentReference, setLastPaymentReference] =
    useState<string | null>(null);
  const [orderCreatingFromReference, setOrderCreatingFromReference] =
    useState(false);

  const { isProcessing, error, result, createOrder, reset } = useCheckout();

  const isPaymentReady =
    email.trim() !== "" &&
    items.length > 0 &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    deliveryAddress.trim() !== "" &&
    selectedDeliveryOption !== null;

  const amountInLowestDenomination = Math.round(total * 100);

  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;
  if (!paystackPublicKey) {
    console.error(
      "Missing NEXT_PUBLIC_PAYSTACK_KEY; Paystack payment will be disabled."
    );
  }
  const safePaystackPublicKey = paystackPublicKey || "";

  const [paystackReference, setPaystackReference] = useState<string>(
    `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
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
    [
      paystackReference,
      email,
      amountInLowestDenomination,
      safePaystackPublicKey,
    ]
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
    ...(session?.user?.id && session.user.role === "customer"
      ? { id: session.user.id }
      : {}),
  };

  const buildCartItemsPayload = useCallback((): CartItemPayload[] => {
    return items.map((it) => ({
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
      setHasAttemptedPayment(true);
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
        currency,
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
    setHasAttemptedPayment(true);
    if (!lastPaymentReference) return;
    if (isProcessing || orderCreatingFromReference) return;

    setOrderCreatingFromReference(true);
    try {
      const cartItems = buildCartItemsPayload();

      const order = await createOrder({
        items: cartItems,
        customer: customerPayload,
        paymentMethod: "Paystack",
        currency,
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
          {/* Delivery & Billing */}
          <div className="lg:col-span-2 space-y-8 flex flex-col">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Delivery Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="First Name" htmlFor="firstName">
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                  />
                </FormField>
                <FormField label="Last Name" htmlFor="lastName">
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                  />
                </FormField>
                <FormField label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                  />
                </FormField>
                <FormField label="Phone Number" htmlFor="phone">
                  <div className="flex">
                    <Select value={phoneCode} onValueChange={setPhoneCode}>
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
                      onChange={(e) => setPhoneNumber(e.currentTarget.value)}
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
                    onChange={(e) => setDeliveryAddress(e.currentTarget.value)}
                    rows={3}
                  />
                </FormField>
              </div>
            </div>

            {/* Billing Info & Delivery Option */}
            <div className="space-y-6 flex flex-col">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                <div className="flex items-center mb-4">
                  <input
                    id="sameBilling"
                    type="checkbox"
                    checked={billingSame}
                    onChange={() => setBillingSame((v) => !v)}
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
                      onChange={(e) => setBillingAddress(e.currentTarget.value)}
                      rows={3}
                    />
                  </FormField>
                )}
              </div>

              {country?.name === "Nigeria" && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                  <h2 className="text-xl font-semibold mb-4">
                    Delivery Option
                  </h2>
                  {deliveryOptions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No delivery options available for {country?.name}.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {deliveryOptions.map((opt) => {
                        const modeLabel =
                          opt.pricingMode === "EXTERNAL"
                            ? "external pricing"
                            : "fixed pricing";
                        return (
                          <div
                            key={opt.id}
                            className={`border rounded-lg p-4 flex justify-between items-start ${
                              selectedDeliveryOption?.id === opt.id
                                ? "ring-2 ring-brand"
                                : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{opt.name}</div>
                              <div className="text-xs text-gray-600">
                                {opt.provider ? `Provider: ${opt.provider}` : "Courier"} • {modeLabel}
                              </div>
                              <div className="text-sm mt-1">
                                Fee: {formatAmount(opt.baseFee ?? 0, currency)}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="deliveryOption"
                                checked={selectedDeliveryOption?.id === opt.id}
                                onChange={() => setSelectedDeliveryOption(opt)}
                                aria-label={`Select delivery option ${opt.name}`}
                                className="ml-2"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart + Summary */}
          <div className="space-y-6 flex flex-col min-h-0">
            {/* Cart items card */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Your Cart</h2>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-60">
                  <ul className="divide-y divide-gray-200">
                    {items.map((item, idx) => {
                      const unitWeight = item.unitWeight ?? 0;
                      const lineWeight = parseFloat(
                        ((unitWeight * item.quantity) || 0).toFixed(3)
                      );
                      return (
                        <li
                          key={`${item.product.id}-${item.color}-${item.size}-${idx}`}
                          className="py-3 flex justify-between items-start"
                        >
                          <div className="flex items-start gap-3">
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
                                {item.color}, {item.hasSizeMod ? "Custom" : item.size} × {item.quantity}
                              </p>
                              {item.hasSizeMod && (
                                <p className="text-xs text-yellow-600">
                                  +5% size-mod fee
                                </p>
                              )}
                              <p className="text-xs text-gray-600 mt-1">
                                Unit weight: {unitWeight.toFixed(3)}kg • Total:{" "}
                                {lineWeight.toFixed(3)}kg
                              </p>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                            {formatAmount(item.price * item.quantity, currency)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm flex-1">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>{formatAmount(itemsSubtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size Mods:</span>
                  <span>{formatAmount(sizeModTotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>{formatAmount(deliveryFee, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span>{totalWeight.toFixed(3)}kg</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatAmount(total, currency)}</span>
                </div>
              </div>

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
                        setHasAttemptedPayment(true);
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
                  </div>
                )}
              </div>
            </div>

            {hasAttemptedPayment && error && (
              <div className="mt-2 px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm shadow-sm">
                {typeof error === "string" ? error : error.error}
                {error.code && (
                  <div className="text-xs mt-1">Code: {error.code}</div>
                )}
                {error.details && (
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
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
