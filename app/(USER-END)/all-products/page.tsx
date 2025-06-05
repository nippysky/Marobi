import React from "react";
import Link from "next/link";

import { ALL_PRODUCTS, Product } from "@/lib/products";
import Header from "@/components/shared/header";
import ProductCard from "@/components/shared/product-card";

// Simple shuffle function (Fisher–Yates)
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function AllProducts() {
  const products: Product[] = shuffle(ALL_PRODUCTS);

  return (
    <section className="flex flex-col">
      {/* Site Header */}
      <Header />

      <main className="mt-10 pb-20 lg:px-20 md:px-10 px-5 w-full">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / <span className="font-medium">All Products</span>
        </nav>

        <h1 className="text-3xl font-bold mb-6">All Products</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      </main>
    </section>
  );
}
