"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ALL_PRODUCTS, Product } from "@/lib/products";

export default function AdCarousel() {
  const ads = ALL_PRODUCTS.filter((p) => !!p.imageUrl);

  // 1) Start at index 0 so SSR and client initial render match
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // 2) Once mounted, immediately pick a random start
    setIdx(Math.floor(Math.random() * ads.length));

    // 3) Then every 10s (or your desired interval), pick a new one
    const handle = setInterval(() => {
      setIdx((current) => {
        let next = Math.floor(Math.random() * ads.length);
        if (ads.length > 1) {
          while (next === current) {
            next = Math.floor(Math.random() * ads.length);
          }
        }
        return next;
      });
    }, 25_000);

    return () => clearInterval(handle);
  }, [ads.length]);

  const product: Product = ads[idx];

  return (
    <div className="relative h-full w-full bg-primary">
      {/* contained background */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url(${product.imageUrl})` }}
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* CTA */}
      <div className="absolute inset-0 flex flex-col justify-end p-8">
        <h2 className="text-3xl font-bold text-white">{product.name}</h2>
        <Link
          href={`/product/${product.id}`}
          className="mt-4 inline-flex items-center text-white hover:underline"
        >
          <span>View Product</span>
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
