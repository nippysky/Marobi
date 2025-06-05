"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/lib/context/currencyContext";
import { useExchangeRates } from "@/lib/hooks/useExchangeRates";
import { formatAmount } from "@/lib/formatCurrency";

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number; // in NGN
  category: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { currency } = useCurrency();
  const { convertFromNgn, isFetching } = useExchangeRates();

  // Compute converted price (in target currency) whenever quotes or selected currency change
  const convertedPrice = isFetching
    ? null
    : formatAmount(convertFromNgn(product.price, currency), currency);

  return (
    <div className="group">
      {/* 1. Skeleton placeholder (shown while image loading) */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
        {isLoading && <Skeleton className="absolute inset-0 h-full w-full" />}

        {/* 2. Actual Image */}
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={`
            object-cover
            transition-transform duration-300 ease-in-out 
            ${isLoading ? "opacity-0" : "opacity-100 group-hover:scale-105"}
          `}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* 3. Name (single‐line, truncated) */}
      <h2 className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
        {product.name}
      </h2>

      {/* 4. Price */}
      <div className="mt-1 text-[0.9rem] font-semibold text-gray-600 dark:text-gray-400">
        {isFetching ? <Skeleton className="h-4 w-16" /> : convertedPrice}
      </div>
    </div>
  );
};

export default ProductCard;
