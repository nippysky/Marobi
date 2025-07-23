"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
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
import { Trash2, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  maxQty: number;
}

type PaymentMethod = "Cash" | "Transfer" | "Card";

interface Props {
  staffId: string;
}

export default function OfflineSaleForm({ staffId }: Props) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<LineItem[]>([
    { id: uuid(), productId: "", productName: "", color: "", size: "", quantity: 1, maxQty: 1 },
  ]);
  const [mode, setMode] = useState<"existing" | "guest">("existing");
  const [existingCustomerId, setExistingCustomerId] = useState("");
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

  // validation
  const canNext =
    step === 1
      ? items.every(i => i.productId && i.color && i.size && i.quantity > 0)
      : step === 2
      ? mode === "existing"
        ? !!existingCustomerId
        : guest.firstName && guest.lastName && guest.email && guest.phone && guest.address
      : true;

  const canSubmit = step === 3 && canNext;

  // products
  const addRow = () =>
    setItems(s => [...s, { id: uuid(), productId: "", productName: "", color: "", size: "", quantity: 1, maxQty: 1 }]);
  const removeRow = (id: string) =>
    setItems(s => s.filter(i => i.id !== id));

  async function onSelectProduct(rowId: string, productId: string) {
    const db = await fetch(`/api/products/${productId}`).then(r => r.json());
    setItems(s =>
      s.map(i =>
        i.id === rowId
          ? {
              ...i,
              productId,
              productName: db.name,
              color: db.variants[0]?.color ?? "",
              size: db.variants[0]?.size ?? "",
              maxQty: db.variants[0]?.stock ?? 1,
              quantity: 1,
            }
          : i
      )
    );
  }

  function updateRow(id: string, field: keyof LineItem, value: any) {
    setItems(s =>
      s.map(i => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await fetch("/api/offline-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
          })),
          customer:
            mode === "existing" ? { id: existingCustomerId } : guest,
          paymentMethod,
          staffId,
          timestamp: new Date().toISOString(),
        }),
      });
      toast.success("Offline sale logged!");
      // reset
      setItems([{ id: uuid(), productId: "", productName: "", color: "", size: "", quantity: 1, maxQty: 1 }]);
      setMode("existing");
      setExistingCustomerId("");
      setGuest({ firstName: "", lastName: "", email: "", phone: "", address: "", country: "", state: "" });
      setPaymentMethod("Cash");
      setStep(1);
    } catch {
      toast.error("Failed to log sale");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <nav className="flex space-x-4">
            {["Products", "Customer", "Payment"].map((label, i) => (
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
                {label}
              </button>
            ))}
          </nav>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <section className="space-y-4">
            {items.map(row => (
              <div
                key={row.id}
                className="grid grid-cols-6 gap-3 items-end"
              >
                {/* search & select product */}
                <div className="col-span-2">
                  <Input
                    placeholder="Product ID or name…"
                    value={row.productName}
                    onChange={e =>
                      updateRow(row.id, "productName", e.target.value)
                    }
                    onBlur={() =>
                      row.productName &&
                      onSelectProduct(row.id, row.productName)
                    }
                  />
                </div>
                <div>
                  <Select
                    value={row.color}
                    onValueChange={v =>
                      updateRow(row.id, "color", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Color" />
                    </SelectTrigger>
                    <SelectContent>
                      {row.color && <SelectItem value={row.color}>{row.color}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={row.size}
                    onValueChange={v =>
                      updateRow(row.id, "size", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {row.size && <SelectItem value={row.size}>{row.size}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="number"
                    min={1}
                    max={row.maxQty}
                    value={row.quantity}
                    onChange={e =>
                      updateRow(
                        row.id,
                        "quantity",
                        Math.min(row.maxQty, +e.target.value)
                      )
                    }
                  />
                </div>
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
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={mode === "existing"}
                  onChange={() => setMode("existing")}
                />
                <span>Existing Customer</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={mode === "guest"}
                  onChange={() => setMode("guest")}
                />
                <span>Guest</span>
              </label>
            </div>
            {mode === "existing" ? (
              <Input
                placeholder="Customer ID or email…"
                value={existingCustomerId}
                onChange={e => setExistingCustomerId(e.target.value)}
                disabled={loading}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {["firstName","lastName","email","phone","address","country","state"].map((field, i) => (
                  <Input
                    key={i}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={(guest as any)[field]}
                    onChange={e =>
                      setGuest(g => ({ ...g, [field]: e.target.value }))
                    }
                    disabled={loading}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <Select
              value={paymentMethod}
              onValueChange={v => setPaymentMethod(v as PaymentMethod)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {["Cash","Transfer","Card"].map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
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
          onClick={() => setStep(s => s - 1)}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => canNext && setStep(s => s + 1)}
            disabled={!canNext || loading}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? "Logging…" : "Log Offline Sale"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
