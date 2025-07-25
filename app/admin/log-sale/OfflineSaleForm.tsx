"use client";

import React, { useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Currency } from "@/lib/generated/prisma-client";

// --------------------------------------------
// Types
// --------------------------------------------
interface LineItem {
  id: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  maxQty: number;
  colorOptions: string[];
  sizeOptions: string[];
}

type PaymentMethod = "Cash" | "Transfer" | "Card";

interface Props {
  staffId: string;
}

// Represents the shape of each product returned by /api/search-products
interface DBVariant {
  color: string;
  size: string;
  stock: number;
}
interface DBProduct {
  id: string;
  name: string;
  variants: DBVariant[];
}

// --------------------------------------------
// Debounce helper
// --------------------------------------------
function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return (...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  };
}

// --------------------------------------------
// Component
// --------------------------------------------
export default function OfflineSaleForm({ staffId }: Props) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<LineItem[]>([
    {
      id: uuid(),
      productId: "",
      productName: "",
      color: "N/A",
      size: "N/A",
      quantity: 1,
      maxQty: 1,
      colorOptions: ["N/A"],
      sizeOptions: ["N/A"],
    },
  ]);

  const [productSearch, setProductSearch] = useState<Record<string, DBProduct[]>>({});
  const [searchingProduct, setSearchingProduct] = useState(false);

  const [mode, setMode] = useState<"existing" | "guest">("existing");
  const [existingCustomerId, setExistingCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState<any[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);


  const [guest, setGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    state: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [loading, setLoading] = useState(false);
    const [currency, setCurrency] = useState<Currency>(Currency.NGN);

  const [successSummary, setSuccessSummary] = useState<{
    orderId: string;
    items: LineItem[];
    paymentMethod: PaymentMethod;
  } | null>(null);

  // --------------------------------------------
  // Validation
  // --------------------------------------------
  const canNext =
    step === 1
      ? items.every((i) => i.productId && i.color && i.size && i.quantity > 0)
      : step === 2
      ? mode === "existing"
        ? !!existingCustomerId
        : !!(
            guest.firstName &&
            guest.lastName &&
            guest.email &&
            guest.phone &&
            guest.address
          )
      : true;

  const canSubmit = step === 3 && canNext;

  // --------------------------------------------
  // Add / Remove rows
  // --------------------------------------------
  const addRow = () =>
    setItems((s) => [
      ...s,
      {
        id: uuid(),
        productId: "",
        productName: "",
        color: "N/A",
        size: "N/A",
        quantity: 1,
        maxQty: 1,
        colorOptions: ["N/A"],
        sizeOptions: ["N/A"],
      },
    ]);

  const removeRow = (id: string) =>
    setItems((s) => s.filter((i) => i.id !== id));

  // --------------------------------------------
  // Product search
  // --------------------------------------------
  const fetchProducts = async (rowId: string, query: string) => {
    if (!query || query.length < 2) {
      setProductSearch((p) => ({ ...p, [rowId]: [] }));
      return;
    }
    setSearchingProduct(true);
    const res = await fetch(`/api/search-products?query=${query}`);
    const data: DBProduct[] = await res.json();
    setProductSearch((p) => ({ ...p, [rowId]: data }));
    setSearchingProduct(false);
  };
  const debouncedFetchProducts = useDebounce(fetchProducts, 300);

  function selectProduct(rowId: string, product: DBProduct) {
    // build unique, non-empty color/size lists
    const colors = Array.from(
      new Set(
        product.variants
          .map((v) => v.color.trim() || "N/A")
          .filter((c) => c)
      )
    );
    const sizes = Array.from(
      new Set(
        product.variants
          .map((v) => v.size.trim() || "N/A")
          .filter((s) => s)
      )
    );
    const colorOptions = colors.length ? colors : ["N/A"];
    const sizeOptions = sizes.length ? sizes : ["N/A"];

    // pick first variant for stock
    const selColor = colorOptions[0];
    const selSize = sizeOptions[0];
    const match = product.variants.find(
      (v) => (v.color.trim() || "N/A") === selColor && (v.size.trim() || "N/A") === selSize
    );
    const maxQty = match?.stock ?? 1;

    setItems((prev) =>
      prev.map((i) =>
        i.id === rowId
          ? {
              ...i,
              productId: product.id,
              productName: product.name,
              color: selColor,
              size: selSize,
              maxQty,
              colorOptions,
              sizeOptions,
              quantity: 1,
            }
          : i
      )
    );
    setProductSearch((p) => ({ ...p, [rowId]: [] }));
  }

  function updateRow(
    id: string,
    field: keyof LineItem,
    value: string | number
  ) {
    setItems((s) =>
      s.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  // --------------------------------------------
  // Customer search
  // --------------------------------------------
  const fetchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomerSearch([]);
      return;
    }
    setSearchingCustomer(true);
    const res = await fetch(`/api/search-customers?query=${query}`);
    const data = await res.json();
    setCustomerSearch(data);
    setSearchingCustomer(false);
  };
  const debouncedFetchCustomers = useDebounce(fetchCustomers, 300);

  function selectCustomer(c: any) {
    setExistingCustomerId(c.id);
    setCustomerSearch([]);
  }

  // --------------------------------------------
  // Submit
  // --------------------------------------------
  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const res = await fetch("/api/offline-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
          })),
          customer:
            mode === "existing" ? { id: existingCustomerId } : guest,
          paymentMethod,
          currency,  
          staffId,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to log sale");
        return;
      }

      toast.success("Offline sale logged!");
      setSuccessSummary({
        orderId: data.orderId,
        items: [...items],
        paymentMethod,
      });

      // reset form
      setItems([
        {
          id: uuid(),
          productId: "",
          productName: "",
          color: "N/A",
          size: "N/A",
          quantity: 1,
          maxQty: 1,
          colorOptions: ["N/A"],
          sizeOptions: ["N/A"],
        },
      ]);
      setMode("existing");
      setExistingCustomerId("");
      setGuest({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        state: "",
      });
      setPaymentMethod("Cash");
      setStep(1);
    } catch {
      toast.error("Failed to log sale");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------
  // Render
  // --------------------------------------------
  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>
          <nav className="flex space-x-4">
            {["Products", "Customer", "Payment"].map((lbl, i) => (
              <button
                key={i}
                disabled={i + 1 > step || loading}
                onClick={() => setStep(i + 1)}
                className={`flex-1 py-2 text-center ${
                  step === i + 1
                    ? "border-b-2 border-indigo-600 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {lbl}
              </button>
            ))}
          </nav>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* success summary */}
        {successSummary && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-bold text-green-700">Sale Logged!</h3>
            <p>Order ID: {successSummary.orderId}</p>
            <p>Payment: {successSummary.paymentMethod}</p>
            <ul className="list-disc pl-5">
              {successSummary.items.map((it) => (
                <li key={it.id}>
                  {it.productName} ({it.color}/{it.size}) × {it.quantity}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* step 1: products */}
        {step === 1 && (
          <div className="space-y-4">
            {items.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-6 gap-3 items-start relative"
              >
                {/* product search */}
                <div className="col-span-2 relative">
                  <Input
                    placeholder="Search product…"
                    value={row.productName}
                    onChange={(e) => {
                      updateRow(row.id, "productName", e.target.value);
                      debouncedFetchProducts(row.id, e.target.value);
                    }}
                  />
                  {searchingProduct && (
                    <div className="absolute right-2 top-2 text-gray-400">
                      <Loader2 className="animate-spin" size={16} />
                    </div>
                  )}
                  {productSearch[row.id]?.length > 0 && (
                    <div className="absolute z-10 bg-white border mt-1 rounded shadow overflow-y-auto max-h-48 w-full">
                      {productSearch[row.id].map((p) => (
                        <div
                          key={p.id}
                          className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectProduct(row.id, p)}
                        >
                          {p.name} ({p.id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* color */}
                <Select
                  value={row.color}
                  onValueChange={(v) => updateRow(row.id, "color", v)}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {row.colorOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* size */}
                <Select
                  value={row.size}
                  onValueChange={(v) => updateRow(row.id, "size", v)}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {row.sizeOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* quantity */}
                <Input
                  type="number"
                  min={1}
                  max={row.maxQty}
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(
                      row.id,
                      "quantity",
                      Math.min(row.maxQty, +e.target.value)
                    )
                  }
                />

                <button
                  onClick={() => removeRow(row.id)}
                  disabled={items.length === 1 || loading}
                  className="text-red-600 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={loading}
            >
              <PlusCircle className="mr-1" /> Add Product
            </Button>
          </div>
        )}

        {/* step 2: customer */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-6">
              {["existing", "guest"].map((m) => (
                <label key={m} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={mode === m}
                    onChange={() => setMode(m as any)}
                  />
                  <span>
                    {m === "existing" ? "Existing Customer" : "Guest"}
                  </span>
                </label>
              ))}
            </div>

            {mode === "existing" ? (
              <div className="relative">
                <Input
                  placeholder="Search by name, email, or phone…"
                  value={existingCustomerId}
                  onChange={(e) => {
                    setExistingCustomerId(e.target.value);
                    debouncedFetchCustomers(e.target.value);
                  }}
                />
                {searchingCustomer && (
                  <div className="absolute right-2 top-2 text-gray-400">
                    <Loader2 className="animate-spin" size={16} />
                  </div>
                )}
                {customerSearch.length > 0 && (
                  <div className="absolute z-10 bg-white border mt-1 rounded shadow overflow-y-auto max-h-48 w-full">
                    {customerSearch.map((c) => (
                      <div
                        key={c.id}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectCustomer(c)}
                      >
                        {c.firstName} {c.lastName} ({c.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {["firstName", "lastName", "email", "phone", "address", "country", "state"].map(
                  (f) => (
                    <Input
                      key={f}
                      placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={(guest as any)[f]}
                      onChange={(e) =>
                        setGuest((g) => ({ ...g, [f]: e.target.value }))
                      }
                      disabled={loading}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}

 {/* STEP 3: PAYMENT & CURRENCY */}
      {step === 3 && (
        <section className="space-y-4 grid grid-cols-2 gap-4">
          <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)} disabled={loading}>
            <SelectTrigger className="w-auto"><SelectValue placeholder="Payment Method" /></SelectTrigger>
            <SelectContent>
              {["Cash","Transfer","Card"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={currency} onValueChange={v => setCurrency(v as Currency)} disabled={loading}>
            <SelectTrigger className="w-auto"><SelectValue placeholder="Currency" /></SelectTrigger>
            <SelectContent>
              {Object.values(Currency).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={step === 1 || loading}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button
            disabled={!canNext || loading}
            onClick={() => canNext && setStep((s) => s + 1)}
          >
            Next
          </Button>
        ) : (
          <Button disabled={!canSubmit || loading} onClick={handleSubmit}>
            {loading ? "Logging…" : "Log Offline Sale"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
