// components/ProductShowcase.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ProductCard } from "./shared/product-card";

type Product = {
  id: string;
  name: string;
  imageUrl: string;
};

type Category = {
  name: string;
  viewMoreHref: string;
  products: Product[];
};

interface ShowcaseProps {
  categories: Category[];
}

export const ProductShowcase: React.FC<ShowcaseProps> = ({ categories }) => {
  return (
    <div className="space-y-20 mx-auto max-w-[1920px] py-20 px-5 md:px-8 lg:px-12">
      {categories.map((category) => (
        <section key={category.name}>
          {/* ───────────────────────────────────────────────────────────
              Category Header: Title + “View More” (semibold & underlined),
              hidden on mobile (<sm)
          ─────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {category.name}
            </h2>

            {/* Show this link only on sm (640px) and up; hide on mobile */}
            <Link
              href={category.viewMoreHref}
              className="
                hidden sm:inline-block 
                text-sm font-semibold underline 
                text-gray-600 hover:text-gray-800 
                dark:text-gray-400 dark:hover:text-gray-200
              "
            >
              View More {category.name}
            </Link>
          </div>

          {/* ───────────────────────────────────────────────────────────
              Responsive Grid of ProductCards
          ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* ───────────────────────────────────────────────────────────
              On mobile (<sm), show a full-width “View More” button
              under the grid. Hidden on sm and up.
          ─────────────────────────────────────────────────────────── */}
          <div className="mt-6 sm:hidden">
            <Link
              href={category.viewMoreHref}
              className="
                block
                text-center
                w-full
                bg-gray-100 hover:bg-gray-200
                dark:bg-gray-800 dark:hover:bg-gray-700
                text-gray-800 dark:text-gray-200
                font-semibold
                py-2.5
                rounded-md
                transition-colors duration-200
              "
            >
              View More {category.name}
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductShowcase;
