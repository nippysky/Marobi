"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import ProductCard from "@/components/shared/product-card";
import type { Product } from "@/lib/products";

function useDebounce<T>(value: T, delay = 300): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setD(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function SearchMobileSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query.trim(), 300);

  // Lock scroll when open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Fetch like your modal
  const { data: products = [], isFetching, isError } = useQuery<Product[], Error>({
    queryKey: ["mobile-sheet-search", debounced.toLowerCase()],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/search?query=${encodeURIComponent(debounced)}`, { signal });
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as Product[];
    },
    enabled: open && debounced.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // ESC to close (when keyboard present with HW keys)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[98] bg-black/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 top-0 z-[99] bg-white dark:bg-[#0f111a] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.28 }}
          >
            {/* Header with input */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  placeholder="Search for items, categories..."
                  className="w-full rounded-full py-3 pl-4 pr-12 text-sm shadow-inner"
                />
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {debounced === "" ? (
                <div className="mt-10 text-center text-gray-500">
                  Start typing to discover products…
                </div>
              ) : isFetching ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-[160px] w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/2 rounded" />
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="mt-10 text-center text-red-600">
                  Something went wrong. Please try again.
                </div>
              ) : products.length === 0 ? (
                <div className="mt-10 text-center text-gray-500">No products found.</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {products.map((p) => (
                    <Link key={p.id} href={`/product/${p.id}`} onClick={onClose} className="block">
                      <ProductCard product={p} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
