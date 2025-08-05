// lib/hooks/useCheckoutForm.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";

export interface CountryData {
  name: string;
  iso2: string;
  callingCodes: string[];
}

export interface DeliveryOption {
  id: string;
  name: string;
  provider?: string | null;
  type: "COURIER" | "PICKUP";
  baseFee: number;
  active: boolean;
  metadata?: any;
}

/**
 * Hook to manage country / state / phone code selection.
 */
export function useCountryState(initialCountryName?: string, initialState?: string) {
  const [countryList, setCountryList] = useState<CountryData[]>([]);
  const [country, setCountry] = useState<CountryData | null>(null);
  const [stateList, setStateList] = useState<string[]>([]);
  const [state, setState] = useState(initialState ?? "");
  const [phoneCode, setPhoneCode] = useState("+234");

  // Load countries
  useEffect(() => {
    let cancelled = false;
    async function loadCountries() {
      try {
        const res = await fetch("/api/utils/countries");
        if (!res.ok) throw new Error("Failed to fetch countries");
        const data: CountryData[] = await res.json();
        if (cancelled) return;
        setCountryList(data);
        const defaultCountry =
          data.find((c) => c.name === initialCountryName) ??
          data.find((c) => c.name === "Nigeria") ??
          null;
        setCountry(defaultCountry);
        if (defaultCountry?.callingCodes.length) {
          setPhoneCode(`+${defaultCountry.callingCodes[0]}`);
        }
      } catch (err) {
        console.error("useCountryState.loadCountries error:", err);
        if (!cancelled) {
          setCountryList([]);
          toast.error("Could not load country list.");
        }
      }
    }
    loadCountries();
    return () => {
      cancelled = true;
    };
  }, [initialCountryName]);

  // Load states when country changes
  useEffect(() => {
    let cancelled = false;
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
        if (cancelled) return;
        setStateList(json.states ?? []);
      } catch (err) {
        console.error("useCountryState.loadStates error:", err);
        if (!cancelled) {
          setStateList([]);
          toast.error("Could not load states.");
        }
      }
      if (country?.callingCodes?.length) {
        setPhoneCode(`+${country.callingCodes[0]}`);
      }
    }
    loadStates();
    return () => {
      cancelled = true;
    };
  }, [country]);

  // Phone options derived from countryList
  const phoneOptions = useMemo(
    () =>
      countryList
        .flatMap((c) =>
          c.callingCodes.map((code) => ({
            code: `+${code}`,
            iso2: c.iso2,
          }))
        )
        .reduce<{ code: string; iso2: string }[]>((acc, cur) => {
          if (!acc.find((x) => x.code === cur.code)) acc.push(cur);
          return acc;
        }, []),
    [countryList]
  );

  return {
    countryList,
    country,
    setCountry,
    stateList,
    state,
    setState,
    phoneCode,
    setPhoneCode,
    phoneOptions,
  };
}

/**
 * Hook to load delivery options based on selected country.
 */
export function useDeliveryOptions(countryName: string | undefined | null) {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] =
    useState<DeliveryOption | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      if (!countryName) return;
      try {
        const res = await fetch(
          `/api/delivery-options?country=${encodeURIComponent(countryName)}`
        );
        if (!res.ok) throw new Error("Failed to load delivery options");
        const data: DeliveryOption[] = await res.json();
        if (cancelled) return;
        const activeOptions = data.filter((o) => o.active);
        setDeliveryOptions(activeOptions);
        setSelectedDeliveryOption((prev) => {
          if (prev) {
            const matched = activeOptions.find((o) => o.id === prev.id);
            if (matched) return matched;
          }
          return activeOptions[0] ?? null;
        });
      } catch (err) {
        console.error("useDeliveryOptions.loadOptions error:", err);
        if (!cancelled) {
          toast.error("Could not load delivery options.");
        }
      }
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [countryName]);

  const deliveryFee = selectedDeliveryOption?.baseFee ?? 0;

  return {
    deliveryOptions,
    selectedDeliveryOption,
    setSelectedDeliveryOption,
    deliveryFee,
  };
}

/**
 * Hook to compute cart totals.
 */
export function useCartTotals(items: { price: number; sizeModFee: number; quantity: number; unitWeight?: number }[]) {
  const itemsSubtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.price - item.sizeModFee) * item.quantity,
        0
      ),
    [items]
  );
  const sizeModTotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.sizeModFee * item.quantity, 0),
    [items]
  );
  const totalWeight = useMemo(
    () =>
      items
        .reduce(
          (sum, item) =>
            sum +
            ((item.unitWeight ?? 0) * item.quantity),
          0
        ),
    [items]
  );
  const total = itemsSubtotal + sizeModTotal;

  return {
    itemsSubtotal,
    sizeModTotal,
    totalWeight,
    total, // without delivery fee
  };
}
