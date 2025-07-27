"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import type { Product } from "@/lib/products";

interface SearchBarProps {
  className?: string;
}

// simple debounce hook
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 300);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { currency } = useCurrency();

  // close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // fetch matching products via React Query
  const { data: products = [], isFetching } = useQuery<Product[], Error>({
    queryKey: ["search-bar", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(debouncedQuery)}`
      );
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as Product[];
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // top 6 results
  const results = products.slice(0, 6);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
        />
        <Input
          placeholder="Search products…"
          className="pl-10 pr-4 py-2 rounded-full placeholder:text-center"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onFocus={() => setOpen(true)}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto rounded-lg bg-white shadow-lg z-50"
          >
            {debouncedQuery === "" ? (
              <p className="p-4 text-gray-500 text-sm">Type to search…</p>
            ) : isFetching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2 px-3">
                    <div className="h-12 w-12 bg-gray-100 rounded" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">No products found.</p>
            ) : (
              results.map((p) => {
                // Use only your real product price
                const price = formatAmount(p.prices[currency], currency);
                // Use main image (or a placeholder)
                const imgSrc = p.images && p.images.length > 0
                  ? p.images[0]
                  : "/placeholder.svg";

                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100"
                  >
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                      <Image
                        src={imgSrc}
                        alt={p.name}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized // Optional: skip Next.js optimization for local images
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {p.name}
                      </p>
                      <p className="text-sm text-gray-600">{price}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.category}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
