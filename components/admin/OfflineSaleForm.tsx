"use client";

import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

interface Props {
  staffId: string;
}

export default function OfflineSaleForm({ staffId }: Props) {
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
  });

  type Payment = "Cash" | "Transfer" | "Card";
  const [paymentMethod, setPaymentMethod] = useState<Payment>("Cash");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    items.length > 0 &&
    items.every((i) => i.productId && i.color && i.size && i.quantity > 0) &&
    (mode === "existing"
      ? !!existingCustomerId
      : guest.firstName && guest.lastName && guest.email && guest.phone);

  const addRow = () =>
    setItems([
      ...items,
      { id: uuid(), productId: "", productName: "", color: "", size: "", quantity: 1, maxQty: 1 },
    ]);
  const removeRow = (id: string) =>
    setItems(items.filter((i) => i.id !== id));

  async function onSelectProduct(rowId: string, productId: string) {
    const db = await fetch(`/api/products/${productId}`).then((r) => r.json());
    setItems((prev) =>
      prev.map((i) =>
        i.id === rowId
          ? {
              ...i,
              productId,
              productName: db.name,
              color: db.variants[0].color,
              size: db.variants[0].size,
              maxQty: db.variants[0].stock,
              quantity: 1,
            }
          : i
      )
    );
  }

  const updateRow = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, [field]: value }
          : i
      )
    );
  };

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await fetch("/api/offline-sales", {
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
            mode === "existing"
              ? { id: existingCustomerId }
              : guest,
          paymentMethod,
          staffId,
          timestamp: new Date().toISOString(),
        }),
      });
      toast.success("Offline sale logged!");
      setItems([
        { id: uuid(), productId: "", productName: "", color: "", size: "", quantity: 1, maxQty: 1 },
      ]);
      setMode("existing");
      setExistingCustomerId("");
      setGuest({ firstName: "", lastName: "", email: "", phone: "" });
      setPaymentMethod("Cash");
    } catch {
      toast.error("Failed to log sale");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* LINE ITEMS */}
      <div className="space-y-2">
        <h2 className="font-semibold">Products Sold</h2>
        {items.map((row) => (
          <div key={row.id} className="grid grid-cols-6 gap-2 items-end">
            {/* Product */}
            <div className="col-span-2">
              <Input
                placeholder="Search…"
                value={row.productName}
                onChange={(e) =>
                  updateRow(row.id, "productName", e.target.value)
                }
                onBlur={() =>
                  row.productName && onSelectProduct(row.id, row.productName)
                }
              />
            </div>
            {/* Color */}
            <div>
              <Select
                value={row.color}
                onValueChange={(v) => updateRow(row.id, "color", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  {row.color && (
                    <SelectItem value={row.color}>{row.color}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Size */}
            <div>
              <Select
                value={row.size}
                onValueChange={(v) => updateRow(row.id, "size", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {row.size && (
                    <SelectItem value={row.size}>{row.size}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Quantity */}
            <div>
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
            </div>
            {/* Remove */}
            <button
              onClick={() => removeRow(row.id)}
              disabled={items.length === 1}
              className="text-red-600 p-2"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <Button onClick={addRow} variant="outline" size="sm">
          <PlusCircle className="mr-1" /> Add Product
        </Button>
      </div>

      {/* CUSTOMER */}
      <div className="space-y-2">
        <h2 className="font-semibold">Customer</h2>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
            />
            <span>Existing</span>
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
            onChange={(e) => setExistingCustomerId(e.target.value)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="First Name"
              value={guest.firstName}
              onChange={(e) =>
                setGuest((g) => ({ ...g, firstName: e.target.value }))
              }
            />
            <Input
              placeholder="Last Name"
              value={guest.lastName}
              onChange={(e) =>
                setGuest((g) => ({ ...g, lastName: e.target.value }))
              }
            />
            <Input
              placeholder="Email"
              value={guest.email}
              onChange={(e) =>
                setGuest((g) => ({ ...g, email: e.target.value }))
              }
            />
            <Input
              placeholder="Phone"
              value={guest.phone}
              onChange={(e) =>
                setGuest((g) => ({ ...g, phone: e.target.value }))
              }
            />
          </div>
        )}
      </div>

      {/* PAYMENT */}
      <div className="space-y-2">
        <h2 className="font-semibold">Payment Method</h2>
        <Select
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as Payment)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Card">Card/POS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ACTIONS */}
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? "Logging…" : "Log Offline Sale"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setItems([
              { id: uuid(), productId: "", productName: "", color: "", size: "", quantity: 1, maxQty: 1 },
            ]);
            setMode("existing");
            setExistingCustomerId("");
            setGuest({ firstName: "", lastName: "", email: "", phone: "" });
            setPaymentMethod("Cash");
          }}
        >
          Clear Form
        </Button>
      </div>
    </div>
  );
}
