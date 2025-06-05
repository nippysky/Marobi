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
import { BadgeCheck, Heart, PencilRuler, Play, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { VideoModal } from "./YoutubeVideoModal";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { BsBag } from "react-icons/bs";
import { Skeleton } from "@/components/ui/skeleton";

import { useCurrency } from "@/lib/context/currencyContext";
import { useExchangeRates } from "@/lib/hooks/useExchangeRates";
import { formatAmount } from "@/lib/formatCurrency";

interface ProductDetailHeroProps {
  product: Product;
}

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

  // Currency conversion hooks
  const { currency } = useCurrency();
  const { convertFromNgn, isFetching } = useExchangeRates();
  const convertedPrice = isFetching
    ? null
    : formatAmount(convertFromNgn(product.price, currency), currency);
  const convertedBasePrice =
    product.basePrice && !isFetching
      ? formatAmount(convertFromNgn(product.basePrice, currency), currency)
      : null;

  // Local state for selected options
  const [selectedSize, setSelectedSize] = useState<string | "">("");
  const [selectedColor, setSelectedColor] = useState<string | "">("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Handler for “Add to Cart” with validation
  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color.");
      return;
    }
    if (selectedQuantity < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(product, selectedColor, selectedSize);
    }
    toast.success("Added to cart");
  };

  // Handler for “Buy Now”
  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.error("Please select a size before buying.");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color before buying.");
      return;
    }
    if (selectedQuantity < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(product, selectedColor, selectedSize);
    }
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
            className="object-cover object-center"
            priority
            unoptimized
          />
        </div>

        {/* ─── Right Column: More Photos + Meta + Details ───────────────────────── */}
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
              variant="outline"
              className="w-full mt-3"
              onClick={() => setIsVideoOpen(true)}
            >
              <Play />
              Play Video
            </Button>
          </div>

          {/* ───── Category / Size Chart / In Stock ───── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 text-sm text-gray-700 dark:text-gray-300 mt-5">
            <Link
              href={`/categories/${product.category}`}
              className="flex items-center gap-1 underline"
            >
              <BiCategory className="w-5 h-5" />
              {categoryName}
            </Link>

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

          {/* ───── Price & Base Price (converted) ───── */}
          <div className="space-y-1 mt-5">
            {/* Changed <p> to <div> to avoid nesting <div> inside <p> */}
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isFetching ? <Skeleton className="h-6 w-24" /> : convertedPrice}
            </div>
            {product.basePrice && (
              <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {isFetching ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  convertedBasePrice
                )}
              </div>
            )}
          </div>

          {/* ───── Size / Color / Quantity Selectors ───── */}
          <OptionSelectors
            sizes={["S", "M", "L", "XL"]}
            colors={["White", "Black", "Silver"]}
            maxQuantity={product.inStock}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            selectedQuantity={selectedQuantity}
            onQuantityChange={setSelectedQuantity}
          />

          {/* ───── Buy Now & Add to Cart Buttons ───── */}
          <section className="w-full">
            <div className="mt-5 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                className="w-full"
                onClick={handleBuyNow}
                disabled={
                  !selectedSize || !selectedColor || selectedQuantity < 1
                }
              >
                <Tag />
                Buy Now
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleAddToCart}
                disabled={
                  !selectedSize || !selectedColor || selectedQuantity < 1
                }
              >
                <BsBag />
                Add to Cart
              </Button>
            </div>

            {/* Add to Wishlist */}
            <Button
              className="w-full mt-5"
              variant="secondary"
              onClick={handleAddToWishlist}
            >
              <Heart />
              {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
            </Button>
          </section>
        </div>
      </div>

      {/* Render VideoModal if needed */}
      {isVideoOpen && (
        <VideoModal
          onClose={() => setIsVideoOpen(false)}
          videoId="klKVm1FALhs?si=ad6AgSmIjc2QEqjq"
        />
      )}
    </>
  );
};

export default ProductDetailHero;
