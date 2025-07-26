"use client";

import React from "react";
import Link from "next/link";
import { Box } from "lucide-react";
import ProductCard from "@/components/shared/product-card";
import { Product } from "@/lib/products";

type Category = {
  name: string;
  viewMoreHref: string;
  products: Product[];
};

interface ShowcaseProps {
  categories: Category[];
}

const ProductShowcase: React.FC<ShowcaseProps> = ({ categories }) => {
  return (
    <section className="py-20 space-y-20 max-w-[1920px] mx-auto px-5 md:px-10 lg:px-60">
      {categories.map(({ name, viewMoreHref, products }) => (
        <section key={viewMoreHref}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              {name}
            </h2>
            <Link
              href={viewMoreHref}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold underline text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              View More
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Grid or empty state */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="block"
                >
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Box className="w-12 h-12 mb-4" />
              <p className="text-lg">No products available.</p>
            </div>
          )}

          {/* Mobile “View More” */}
          <div className="mt-6 sm:hidden">
            <Link
              href={viewMoreHref}
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2.5 rounded-md transition-colors duration-200"
            >
              View More
            </Link>
          </div>
        </section>
      ))}
    </section>
  );
};

export default ProductShowcase;
