"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Allowed currencies
export type Currency = "NGN" | "USD" | "EUR" | "GBP";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (newCurrency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState<Currency>("NGN");

  // On mount, read saved currency from localStorage (if any)
  useEffect(() => {
    const saved = localStorage.getItem("currency") as Currency | null;
    if (saved && ["NGN", "USD", "EUR", "GBP"].includes(saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
