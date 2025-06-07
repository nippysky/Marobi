"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import { Product } from "@/lib/products";


interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { currency } = useCurrency();

  // pick the current price and (optional) was‐price
  const currentRaw = product.isDiscounted
    ? product.discountPrices![currency]
    : product.prices[currency];

  const wasRaw =
    product.isDiscounted && product.basePrices
      ? product.basePrices[currency]
      : null;

  const formattedPrice = formatAmount(currentRaw, currency);
  const formattedWas = wasRaw ? formatAmount(wasRaw, currency) : null;

  return (
    <div className="group">
      {/* Image + skeleton */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
        {isLoading && <Skeleton className="absolute inset-0 h-full w-full" />}
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

      {/* Title */}
      <h2 className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
        {product.name}
      </h2>

      {/* Price */}
      <div className="mt-1 flex items-baseline space-x-2 text-[0.9rem] font-semibold text-gray-600 dark:text-gray-400">
        {formattedWas && (
          <span className="line-through text-gray-500 dark:text-gray-500">
            {formattedWas}
          </span>
        )}
        <span className="text-sm text-gray-800 dark:text-gray-200">
          {formattedPrice}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
