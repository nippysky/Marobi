"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Product } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/constants/categories";
import OptionSelectors from "./OptionSelectors";
import { BiCategory } from "react-icons/bi";
import { BadgeCheck, PencilRuler } from "lucide-react";

interface ProductDetailHeroProps {
  product: Product;
}

/**
 * This client component renders:
 * - Left column: large featured image (stateful swap)
 * - Right column: “More Photos” thumbnails, category / size‐chart / stock,
 *   title, description, price, size/color/quantity selectors, and buttons
 */
export const ProductDetailHero: React.FC<ProductDetailHeroProps> = ({
  product,
}) => {
  const [featuredImage, setFeaturedImage] = useState<string>(product.imageUrl);

  // Lookup category name
  const categoryMeta = getCategoryBySlug(product.category);
  const categoryName = categoryMeta ? categoryMeta.name : product.category;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* ─── Left Column: Featured Image ───────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={featuredImage}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* ─── Right Column: More Photos + Meta + Details ───────────────────────── */}
      <div className="flex flex-col space-y-6">
        {/* ───── “More Photos” Thumbnails Row ───── */}
        <div className="space-y-2">
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            More Photos
          </p>
          <div className="flex space-x-3">
            {product.moreImages.map((thumbUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFeaturedImage(thumbUrl)}
                className={`
                  relative w-60 h-[300px] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100
                  ${featuredImage === thumbUrl ? "ring-2 ring-green-500" : ""}
                `}
              >
                <Image
                  src={thumbUrl}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ───── Category / Size Chart / In Stock ───── */}
        <div className="flex items-center space-x-6 text-sm text-gray-700 dark:text-gray-300 mt-5">
          <Link
            href={`/categories/${product.category}`}
            className="flex items-center gap-1 underline"
          >
            <BiCategory className="w-5 h-5" />
            {categoryName}
          </Link>

          <Link
            href="/size-chart"
            className="flex items-center gap-1 underline"
          >
            <PencilRuler className="w-5 h-5" />
            See Size Chart
          </Link>

          <div className="flex items-center gap-1">
            <BadgeCheck className="w-5 h-5" />
            {product.inStock} in Stock
          </div>
        </div>

        {/* ───── Title & Description ───── */}
        <div className="space-y-3 mt-5">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {product.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {product.description}
          </p>
        </div>

        {/* ───── Price & Base Price ───── */}
        <div className="space-y-1 mt-5">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            NGN {product.price.toLocaleString()}
          </p>
          {product.basePrice && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
              NGN {product.basePrice.toLocaleString()}
            </p>
          )}
        </div>

        {/* ───── Size / Color / Quantity (Single Row on MD+) ───── */}
        <OptionSelectors
          sizes={["S", "M", "L", "XL"]}
          colors={["White", "Black", "Silver"]}
          maxQuantity={product.inStock}
        />

        {/* ───── Buy Now & Add to Cart Buttons ───── */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-5">
          <button
            type="button"
            className="
              w-full
              rounded-md
              border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800
              py-3
              text-center text-sm font-semibold text-gray-800 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700
            "
          >
            Buy Now
          </button>
          <button
            type="button"
            className="
              w-full
              rounded-md
              bg-green-500
              py-3
              text-center text-sm font-semibold text-white
              hover:bg-green-600
            "
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailHero;
