// components/SearchModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchModal } from "@/lib/context/searchModalContext";
import { ALL_PRODUCTS, type Product } from "@/lib/products";
import ProductCard from "@/components/shared/product-card";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const containerVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};

export const SearchModal: React.FC = () => {
  const { isOpen, closeModal } = useSearchModal();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const term = query.trim();
    if (term === "") {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (isDev) {
      const filtered = ALL_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(term.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    } else {
      const controller = new AbortController();
      fetch(`/api/search?query=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data: Product[]) => setResults(data))
        .catch((err) => {
          if (err.name !== "AbortError") console.error(err);
        })
        .finally(() => setLoading(false));
      return () => controller.abort();
    }
  }, [query, isOpen, isDev]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
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
            key="container"
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
              <button
                onClick={closeModal}
                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-4 py-3 flex justify-center">
              <div className="w-full max-w-md mx-auto">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  placeholder="Type to search..."
                  className="
                    w-full
                    rounded-full
                    bg-gray-100 dark:bg-gray-800
                    border-transparent
                    focus:ring-0 focus:ring-offset-0
                    text-center placeholder:text-center
                    text-sm py-2
                  "
                />
              </div>
            </div>

            {/* Results / Skeleton */}
            <div className="flex-1 px-4 overflow-y-auto">
              {query.trim() === "" ? (
                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Start typing above to see results…
                </p>
              ) : loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="space-y-2 animate-pulse">
                      <Skeleton className="h-[200px] w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No products found.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-4">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={() => closeModal()}
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
