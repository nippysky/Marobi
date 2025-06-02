"use client"

import { useState, useEffect, useCallback } from "react";
import type { Currency } from "@/lib/context/currencyContext";

interface ApiResponse {
  quotes: Record<string, number>;
  fetchedAt: number;
}

interface UseExchangeRatesResult {
  quotes: Record<string, number> | null;
  isFetching: boolean;
  error: Error | null;

  /**
   * Convert a price in NGN to the selected target currency.
   * @param priceInNgn The original price (in NGN units).
   * @param target One of "NGN", "USD", "EUR", "GBP".
   * @returns The converted numeric value in target currency.
   */
  convertFromNgn: (priceInNgn: number, target: Currency) => number;
}

export function useExchangeRates(): UseExchangeRatesResult {
  const [quotes, setQuotes] = useState<Record<string, number> | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);

    fetch("/api/exchange-rates")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: ApiResponse) => {
        if (!cancelled) {
          setQuotes(data.quotes);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Error fetching exchange rates:", err);
          setError(err as Error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []); // only on mount

  // Convert NGN→target using quotes object
  const convertFromNgn = useCallback(
    (priceInNgn: number, target: Currency): number => {
      if (!quotes) {
        // If quotes not loaded, fallback to raw NGN
        return priceInNgn;
      }
      // 1) find “USDNGN” → how many NGN in 1 USD
      const usdNgn = quotes["USDNGN"];
      if (!usdNgn || usdNgn === 0) {
        return priceInNgn;
      }
      // 2) NGN→USD
      const priceInUsd = priceInNgn / usdNgn;

      if (target === "USD") {
        return priceInUsd;
      }
      if (target === "NGN") {
        return priceInNgn;
      }
      // 3) USD→target (EUR or GBP)
      const key = `USD${target}`; // e.g. “USDEUR” or “USDGBP”
      const usdToTarget = quotes[key];
      if (!usdToTarget) {
        return priceInUsd;
      }
      return priceInUsd * usdToTarget;
    },
    [quotes]
  );

  return {
    quotes,
    isFetching,
    error,
    convertFromNgn,
  };
}
