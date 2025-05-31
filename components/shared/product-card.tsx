"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton"; // adjust path if needed

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  category: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isLoading, setIsLoading] = useState(true);

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
      <p className="mt-1 text-[1rem] text-gray-600 dark:text-gray-400">
        NGN {product.price}
      </p>
    </div>
  );
};

export default ProductCard;
