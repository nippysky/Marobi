import React from "react";
import Link from "next/link";

import { ALL_PRODUCTS, Product } from "@/lib/products";
import Header from "@/components/shared/header";
import FilterableProductList from "@/components/categories/FilterableProductList";
import Footer from "@/components/shared/footer";

// Fisher–Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function AllProductsPage() {
  const products: Product[] = shuffle(ALL_PRODUCTS);

  return (
    <section className="flex flex-col">
      {/* Site Header */}
      <Header />

      <main className="container mx-auto px-5 mt-10 pb-20">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / <span className="font-medium">All Products</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-6">All Products</h1>

        {/* Filter + Grid */}
        <FilterableProductList initialProducts={products} />
      </main>

      <Footer />
    </section>
  );
}
