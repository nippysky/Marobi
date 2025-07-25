"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_PRODUCTS, type Product } from "@/lib/products";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import { getCategoryBySlug } from "@/lib/constants/categories";

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { currency } = useCurrency();

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Filter products by name
  const results: Product[] =
    query.trim() === ""
      ? []
      : ALL_PRODUCTS.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6); // limit to top 6

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          size={16}
        />
        <Input
          placeholder="Search products…"
          className="pl-10 pr-4 py-2 rounded-full placeholder:text-center"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto rounded-lg bg-white shadow-lg z-50"
          >
            {results.length > 0 ? (
              results.map((product) => {
                const category =
                  getCategoryBySlug(product.category)?.name ?? product.category;
                const price =
                  product.isDiscounted && product.discountPrices
                    ? formatAmount(product.discountPrices[currency], currency)
                    : formatAmount(product.prices[currency], currency);

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600">{price}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {category}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="p-4 text-gray-500 text-sm">
                {query.trim() === "" ? "Type to search…" : "No products found."}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
