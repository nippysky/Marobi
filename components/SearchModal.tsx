"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchModal } from "@/lib/context/searchModalContext";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/shared/product-card";
import type { Product } from "@/lib/products";

// Debounce hook — returns `value` only after `delay` ms of no changes
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export const SearchModal: React.FC = () => {
  const { isOpen, closeModal } = useSearchModal();
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query.trim(), 300);

  // Fire off the search only when the modal is open and we have a non‐empty term
  const { data, isFetching } = useQuery<Product[], Error>({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(debouncedQuery)}`
      );
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as Product[];
    },
    enabled: isOpen && debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // cache for 5m
    // keepPreviousData removed to satisfy TS (it’s optional anyway)
  });

  // Normalize to an array so TS knows `results` is always Product[]
  const results: Product[] = data ?? [];

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const containerVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-black overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Search
              </h2>
              <button onClick={closeModal} className="p-2">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Input */}
            <div className="px-4 py-3 flex justify-center">
              <div className="w-full max-w-md">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  placeholder="Type to search…"
                  className="w-full rounded-full bg-gray-100 dark:bg-gray-800 text-center text-sm py-2"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 px-4 overflow-y-auto">
              {debouncedQuery === "" ? (
                <p className="mt-4 text-center text-gray-500">
                  Start typing above…
                </p>
              ) : isFetching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2 animate-pulse">
                      <Skeleton className="h-[200px] w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="mt-4 text-center text-gray-500">
                  No products found.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 py-4">
                  {results.map((product: Product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={closeModal}
                      className="block"
                    >
                      <ProductCard product={product} />
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
};

export default SearchModal;
