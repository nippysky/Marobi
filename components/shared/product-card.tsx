"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { currency } = useCurrency();

  // Grab the first image URL (or undefined)
  const imgUrl = product.images.length > 0 ? product.images[0] : undefined;

  // Price in the current currency
  const rawPrice = product.prices[currency];
  const formattedPrice = formatAmount(rawPrice, currency);

  return (
    <div className="group">
      {/* Image + skeleton */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
        {isLoading && <Skeleton className="absolute inset-0" />}
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-300 ease-in-out ${
              isLoading
                ? "opacity-0"
                : "opacity-100 group-hover:scale-105"
            }`}
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="mt-2 text-sm font-medium text-gray-800 truncate">
        {product.name}
      </h2>

      {/* Price */}
      <div className="mt-1 text-sm font-semibold text-gray-800">
        {formattedPrice}
      </div>
    </div>
  );
};

export default ProductCard;
