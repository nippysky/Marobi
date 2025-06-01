"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { Product } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/constants/categories";
import OptionSelectors from "./OptionSelectors";
import { BiCategory } from "react-icons/bi";
import { BadgeCheck, PencilRuler, Play, X } from "lucide-react";
import { Button } from "./ui/button";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { VideoModal } from "./YoutubeVideoModal";

interface ProductDetailHeroProps {
  product: Product;
}

/**
 * This client component renders:
 * - Left column: large featured image (stateful swap)
 * - Right column: “More Photos” thumbnails (now in a 2-column responsive grid),
 *   category / size‐chart / stock, title, description, price, size/color/quantity selectors, and buttons
 */
export const ProductDetailHero: React.FC<ProductDetailHeroProps> = ({
  product,
}) => {
  const [featuredImage, setFeaturedImage] = useState<string>(product.imageUrl);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Lookup category name
  const categoryMeta = getCategoryBySlug(product.category);
  const categoryName = categoryMeta ? categoryMeta.name : product.category;

  // Hook to open the Size Chart modal
  const { openSizeChart } = useSizeChart();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
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

        {/* ─── Right Column: More Photos (now a grid) + Meta + Details ───────────────────────── */}
        <div className="flex flex-col space-y-6">
          {/* ───── “More Photos” Responsive Grid ───── */}
          <div className="space-y-2">
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              More Photos
            </p>
            <div className="grid grid-cols-3 gap-3">
              {product.moreImages.map((thumbUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFeaturedImage(thumbUrl)}
                  className={`
                    relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gray-100
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

            {/* Video If any */}
            <Button
              variant={"outline"}
              className="w-full mt-3"
              onClick={() => setIsVideoOpen(true)}
            >
              <Play />
              Play Video
            </Button>
          </div>

          {/* ───── Category / Size Chart / In Stock ───── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 text-sm text-gray-700 dark:text-gray-300 mt-5">
            <Link
              href={`/categories/${product.category}`}
              className="flex items-center gap-1 underline"
            >
              <BiCategory className="w-5 h-5" />
              {categoryName}
            </Link>

            {/* Changed from Link to button to open the SizeChartModal */}
            <button
              onClick={openSizeChart}
              className="flex items-center gap-1 underline"
            >
              <PencilRuler className="w-5 h-5" />
              See Size Chart
            </button>

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
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
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
          <section className="w-full">

          <div className=" mt-5 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button  className="w-full"
            >
              Buy Now
            </Button>
            <Button className="w-full" variant={"outline"} onClick={() => alert('Added to cart')}
            >
              Add to Cart
            </Button>
          </div>

          <Button className="w-full mt-5" variant={"secondary"}>
            Add to Wishlist
          </Button>
          </section>
        </div>
      </div>

      {/* Render VideoModal when isVideoOpen is true */}
      {isVideoOpen && (
        <VideoModal
          onClose={() => setIsVideoOpen(false)}
          videoId="klKVm1FALhs?si=ad6AgSmIjc2QEqjq" // Dummy YouTube ID; replace as needed
        />
      )}
    </>
  );
};

export default ProductDetailHero;
