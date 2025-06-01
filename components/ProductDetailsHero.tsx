"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Product } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/constants/categories";
import OptionSelectors from "./OptionSelectors";
import { BiCategory } from "react-icons/bi";
import { BadgeCheck, PencilRuler, Play } from "lucide-react";
import { Button } from "./ui/button";
import { VideoModal } from "./YoutubeVideoModal";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";



interface ProductDetailHeroProps {
  product: Product;
}

/**
 * This client component renders:
 * - Left column: large featured image (stateful swap)
 * - Right column: “More Photos” thumbnails, category/size‐chart/stock, title, description,
 *   price, size/color/quantity selectors, and buttons for Buy/Add to Cart/Add to Wishlist.
 */
export const ProductDetailHero: React.FC<ProductDetailHeroProps> = ({
  product,
}) => {
  const [featuredImage, setFeaturedImage] = useState<string>(product.imageUrl);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const router = useRouter();
  const { openSizeChart } = useSizeChart();
  const addToCart = useCartStore((s) => s.addToCart);
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));

  // Handler for “Add to Cart” (toast only)
  const handleAddToCart = () => {
    addToCart(product);
    toast.success("Added to cart");
  };

  // Handler for “Buy Now”: add to cart + redirect to /checkout
  const handleBuyNow = () => {
    addToCart(product);
    router.push("/checkout");
  };

  // Handler for “Add to Wishlist”
  const handleAddToWishlist = () => {
    if (!isWishlisted) {
      addToWishlist(product);
      toast.success("Added to wishlist");
    } else {
      toast.error("Already in wishlist");
    }
  };

  // Lookup category name
  const categoryMeta = getCategoryBySlug(product.category);
  const categoryName = categoryMeta ? categoryMeta.name : product.category;

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

        {/* ─── Right Column: More Photos + Meta + Details ───────────────────────── */}
        <div className="flex flex-col space-y-6">
          {/* ───── “More Photos” Responsive Grid ───── */}
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
    variant="outline"
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

            <Button
              variant="link"
              onClick={openSizeChart}
              className="flex items-center gap-1 underline p-0"
            >
              <PencilRuler className="w-5 h-5" />
              See Size Chart
            </Button>

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

          {/* ───── Size / Color / Quantity ───── */}
          <OptionSelectors
            sizes={["S", "M", "L", "XL"]}
            colors={["White", "Black", "Silver"]}
            maxQuantity={product.inStock}
          />

          {/* ───── Buy Now & Add to Cart Buttons ───── */}
          <section className="w-full">
            <div className="mt-5 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button className="w-full" onClick={handleBuyNow}>
                Buy Now
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            </div>

            {/* Add to Wishlist */}
            <Button
              className="w-full mt-5"
              variant="secondary"
              onClick={handleAddToWishlist}
            >
              {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
            </Button>
          </section>
        </div>
      </div>

      {/* Render VideoModal if needed */}
      {isVideoOpen && (
        <VideoModal
          onClose={() => setIsVideoOpen(false)}
          videoId="klKVm1FALhs?si=ad6AgSmIjc2QEqjq" // Dummy YouTube ID
        />
      )}
    </>
  );
};

export default ProductDetailHero;
