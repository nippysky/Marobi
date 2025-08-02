"use client";

import Link from "next/link";
import React from "react";
import { Product } from "@/lib/products";
import ProductCard from "@/components/shared/product-card";
import ProductCardSkeleton from "@/components/shared/ProductCardSkeleton";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  fallbackCount?: number;
}

export default function ProductGrid({
  products,
  isLoading = false,
  fallbackCount = 12,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <section className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: fallbackCount }).map((_, i) => (
          <div key={i} className="block">
            <ProductCardSkeleton />
          </div>
        ))}
      </section>
    );
  }

  if (!products.length) {
    return <div className="text-center py-20">No products found.</div>;
  }

  return (
    <section className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((prod) => (
        <Link key={prod.id} href={`/product/${prod.id}`} className="block">
          <ProductCard product={prod} />
        </Link>
      ))}
    </section>
  );
}
