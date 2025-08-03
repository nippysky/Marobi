"use client";

import { useState, useCallback, useEffect } from "react";

export interface CartItemPayload {
  productId: string;
  color: string;
  size: string;
  quantity: number;
  hasSizeMod?: boolean;
  sizeModFee?: number;
  unitWeight?: number;
}

export interface CustomerPayload {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  billingAddress: string;
  country?: string;
  state?: string;
}

export interface OrderResult {
  orderId: string;
  email: string;
}

export interface CreateOrderPayload {
  items: CartItemPayload[];
  customer: CustomerPayload;
  paymentMethod: string;
  currency: string; // expecting uppercase "NGN" | "USD" | ...
  deliveryFee: number;
  timestamp: string;
  deliveryOptionId?: string;
  paymentReference?: string;
  onSuccess?: () => void;
}

const STORAGE_KEY = "pending_order_snapshot_v1";

type Snapshot = {
  clientOrderId: string;
  status: "pending" | "finalizing" | "confirmed" | "failed";
  payload: any;
  result?: OrderResult;
  error?: any; // <-- ALLOW error to be any type, not just string
  updatedAt: string;
};

export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Snapshot = JSON.parse(raw);
        setSnapshot(parsed);
        if (parsed.status === "confirmed" && parsed.result) {
          setResult(parsed.result);
        }
        if (parsed.status === "failed" && parsed.error) {
          setError(parsed.error);
        }
        if (parsed.status === "finalizing") {
          setIsProcessing(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persistSnapshot = useCallback((snap: Snapshot) => {
    setSnapshot(snap);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch {}
  }, []);

  const createOrder = useCallback(
    async (payload: CreateOrderPayload): Promise<OrderResult | null> => {
      setIsProcessing(true);
      setError(null);

      const clientOrderId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      persistSnapshot({
        clientOrderId,
        status: "finalizing",
        payload,
        updatedAt: new Date().toISOString(),
      });

      try {
        const resp = await fetch("/api/orders/online", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await resp.json();
        if (!resp.ok) {
          // Store full error object for debugging!
          setError(json);
          persistSnapshot({
            clientOrderId,
            status: "failed",
            payload,
            error: json,
            updatedAt: new Date().toISOString(),
          });
          setIsProcessing(false);
          return null;
        }

        const orderResult: OrderResult = {
          orderId: json.orderId,
          email: json.email,
        };
        setResult(orderResult);
        persistSnapshot({
          clientOrderId,
          status: "confirmed",
          payload,
          result: orderResult,
          updatedAt: new Date().toISOString(),
        });
        setIsProcessing(false);
        if (payload.onSuccess) {
          try {
            payload.onSuccess();
          } catch {}
        }
        return orderResult;
      } catch (err: any) {
        const msg = err?.message || "Network error";
        setError({ error: msg });
        persistSnapshot({
          clientOrderId,
          status: "failed",
          payload,
          error: { error: msg },
          updatedAt: new Date().toISOString(),
        });
        setIsProcessing(false);
        return null;
      }
    },
    [persistSnapshot]
  );

  return {
    isProcessing,
    error,
    result,
    createOrder,
    snapshot,
    reset: () => {
      setResult(null);
      setError(null);
      setIsProcessing(false);
      setSnapshot(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    },
  };
}
