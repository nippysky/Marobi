"use client";

import React from "react";
import Link from "next/link";

// Import the full Product type (with price, name, etc.)
import { Product } from "@/lib/products";
import ProductCard from "@/components/shared/product-card";
import { MoveRight } from "lucide-react";

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
    <div className="space-y-20 mx-auto max-w-[1920px] py-20 lg:px-40 md:px-10 px-5">
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
              className=" lg:flex flex-row items-center gap-3
                hidden sm:inline-block 
                text-sm font-semibold underline 
                text-gray-600 hover:text-gray-800 
                dark:text-gray-400 dark:hover:text-gray-200
              "
            >
              View More {category.name}
              <MoveRight />
            </Link>
          </div>

          {/* ───────────────────────────────────────────────────────────
              Responsive Grid of ProductCards (with image, title, price)
          ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {category.products.map((product) => (
              <Link
                href={`/product/${product.id}`}
                className="block"
                key={product.id}
              >
                <ProductCard key={product.id} product={product} />
              </Link>
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
