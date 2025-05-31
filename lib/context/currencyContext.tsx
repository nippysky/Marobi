"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the allowable currency strings
export type Currency = "NGN" | "USD" | "EUR" | "GBP";

// Define our context shape:
interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (newCurrency: Currency) => void;
}

// Create the context (initially undefined):
const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

// Provider component that wraps the app (or at least wraps Header)
export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize currency state here once
  const [currency, setCurrency] = useState<Currency>("NGN");

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Hook to consume the currency context:
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
