"use client";

import React, { useEffect, useState} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchModal } from "@/lib/context/searchModalContext";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/shared/product-card";
import type { Product } from "@/lib/products";

// Debounce hook
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
const containerVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
};

export const SearchModal: React.FC = () => {
  const { isOpen, closeModal } = useSearchModal();
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query.trim(), 300);

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

  const {
    data: products = [],
    isFetching,
    isError,
  } = useQuery<Product[], Error>({
    queryKey: ["modal-search", debouncedQuery.toLowerCase()],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(debouncedQuery)}`,
        { signal }
      );
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as Product[];
    },
    enabled: isOpen && debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const results: Product[] = products;

  // Close on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          />

          {/* Modal panel */}
          <motion.div
            className="fixed inset-0 z-60 flex flex-col bg-white dark:bg-[#0f111a] shadow-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-wide text-gray-900 dark:text-gray-100">
                  Search products
                </h2>
                {debouncedQuery && (
                  <span className="text-sm text-gray-500">
                    &ldquo;{debouncedQuery}&rdquo;
                  </span>
                )}
              </div>
              <button
                aria-label="Close search"
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Input */}
            <div className="px-6 py-4">
              <div className="mx-auto max-w-lg">
                <div className="relative">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Search for items, categories..."
                    className="w-full rounded-full py-3 pl-4 pr-12 text-sm shadow-inner"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label="Clear"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 px-6 pb-8 overflow-y-auto">
              {debouncedQuery === "" ? (
                <div className="mt-12 flex flex-col items-center gap-2">
                  <p className="text-center text-gray-500">
                    Start typing to discover products...
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    {/* Optional: recent searches / suggestions placeholders */}
                    <div className="px-4 py-2 bg-gray-100 rounded-full text-xs">
                      Dresses
                    </div>
                    <div className="px-4 py-2 bg-gray-100 rounded-full text-xs">
                      Summer
                    </div>
                    <div className="px-4 py-2 bg-gray-100 rounded-full text-xs">
                      Accessories
                    </div>
                  </div>
                </div>
              ) : isFetching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mt-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-[220px] w-full rounded-2xl" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/2 rounded" />
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="mt-12 text-center text-red-600">
                  <p>Something went wrong. Please try again.</p>
                </div>
              ) : results.length === 0 ? (
                <div className="mt-12 text-center text-gray-500">
                  <p>No products found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mt-4">
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