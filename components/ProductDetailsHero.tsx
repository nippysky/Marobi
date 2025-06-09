"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Product } from "@/lib/products";
import type { User } from "@/lib/session";
import { getCategoryBySlug } from "@/lib/constants/categories";
import OptionSelectors from "./OptionSelectors";
import { BiCategory } from "react-icons/bi";
import { BadgeCheck, Heart, PencilRuler, Play, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { VideoModal } from "./YoutubeVideoModal";
import { Skeleton } from "./ui/skeleton";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import { BsBag } from "react-icons/bs";

interface ProductDetailHeroProps {
  product: Product;
  user: User | null;
}

export const ProductDetailHero: React.FC<ProductDetailHeroProps> = ({
  product,
  user,
}) => {
  // prevent hydration mismatch for wishlist button
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [featuredImage, setFeaturedImage] = useState(product.imageUrl);
  const [imgLoading, setImgLoading] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const router = useRouter();
  const { openSizeChart } = useSizeChart();
  const addToCart = useCartStore((s) => s.addToCart);

  // wishlist actions
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));

  const { currency } = useCurrency();

  // Pricing
  const currentPrice = formatAmount(
    product.isDiscounted && product.discountPrices
      ? product.discountPrices[currency]
      : product.prices[currency],
    currency
  );
  const basePrice =
    product.isDiscounted && product.basePrices
      ? formatAmount(product.basePrices[currency], currency)
      : null;

  // Variants & stock
  const colors = product.variants.map((v) => v.color);
  const sizesForColor = (color: string) =>
    product.variants.find((v) => v.color === color)?.sizes.map((s) => s.size) ||
    [];
  const totalStock = product.variants
    .flatMap((v) => v.sizes)
    .reduce((sum, s) => sum + s.inStock, 0);
  const outOfStock = totalStock === 0;

  // Local selectors
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const sizeToUse =
    product.isSizeModifiable && customSize ? customSize : selectedSize;

  const validate = () => {
    if (outOfStock) {
      toast.error("Sorry, this item is out of stock.");
      return false;
    }
    if (!selectedColor) {
      toast.error("Please select a color.");
      return false;
    }
    if (!sizeToUse) {
      toast.error("Please select or enter a size.");
      return false;
    }
    if (selectedQuantity < 1) {
      toast.error("Quantity must be at least 1.");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(product, selectedColor, sizeToUse);
    }
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(product, selectedColor, sizeToUse);
    }
    router.push("/checkout");
  };

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  const categoryMeta = getCategoryBySlug(product.category);
  const categoryName = categoryMeta ? categoryMeta.name : product.category;

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
        {/* Featured Image */}
        <div className="relative w-full aspect-[4/5] rounded-lg bg-gray-100 overflow-hidden">
          <Skeleton
            className={`absolute inset-0 h-full w-full ${
              imgLoading ? "visible" : "hidden"
            }`}
          />
          <Image
            src={featuredImage}
            alt={product.name}
            fill
            className="object-cover object-center"
            priority
            unoptimized
            onLoad={() => setImgLoading(false)}
          />
        </div>

        {/* Details */}
        <div className="flex flex-col space-y-6">
          {/* More Photos */}
          <div className="space-y-2">
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              More Photos
            </p>
            <div className="grid grid-cols-3 gap-3">
              {product.moreImages.map((thumbUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFeaturedImage(thumbUrl);
                    setImgLoading(true);
                  }}
                  className={`relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gray-100 ${
                    featuredImage === thumbUrl ? "ring-2 ring-green-500" : ""
                  }`}
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
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => setIsVideoOpen(true)}
            >
              <Play /> Play Video
            </Button>
          </div>

          {/* Category / Size Chart / Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5 text-sm text-gray-700 dark:text-gray-300">
            <Link
              href={`/categories/${product.category}`}
              className="flex items-center gap-1 underline"
            >
              <BiCategory className="w-7 h-7" />
              <p className="text-[0.85rem] font-semibold tracking-wider uppercase">
                {categoryName}
              </p>
            </Link>
            <button
              onClick={openSizeChart}
              className="flex items-center gap-1 underline"
            >
              <PencilRuler className="w-7 h-7" />
              <p className="text-[0.85rem] font-semibold tracking-wider uppercase">
                See Size Chart
              </p>
            </button>
            <div
              className={`flex items-center gap-1 ${
                outOfStock
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <BadgeCheck className="w-7 h-7" />
              <p className="text-[0.85rem] font-semibold tracking-wider uppercase">
                {totalStock} in Stock
              </p>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3 mt-5">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {product.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {product.description}
            </p>
          </div>

          {/* Price & Base Price */}
          <div className="space-y-1 mt-5">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {currentPrice}
            </div>
            {basePrice && (
              <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {basePrice}
              </div>
            )}
          </div>

          {/* Variant & Quantity Selectors */}
          <OptionSelectors
            sizes={sizesForColor(selectedColor)}
            colors={colors}
            maxQuantity={totalStock}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
            selectedColor={selectedColor}
            onColorChange={(c) => {
              setSelectedColor(c);
              setSelectedSize("");
            }}
            selectedQuantity={selectedQuantity}
            onQuantityChange={setSelectedQuantity}
          />

          {/* Custom Size Input */}
          {product.isSizeModifiable && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Size
              </label>
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Enter your size"
                className="mt-1 w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:ring focus:ring-green-200"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleBuyNow}
              disabled={
                outOfStock ||
                !selectedColor ||
                !sizeToUse ||
                selectedQuantity < 1
              }
            >
              <Tag /> Buy Now
            </Button>
            <Button
              variant="outline"
              onClick={handleAddToCart}
              disabled={
                outOfStock ||
                !selectedColor ||
                !sizeToUse ||
                selectedQuantity < 1
              }
            >
              <BsBag className="w-5 h-5" />
              Add to Cart
            </Button>
          </div>

          {/* Wishlist Toggle */}
          {user && hasMounted && (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={toggleWishlist}
              disabled={outOfStock}
            >
              <Heart className={isWishlisted ? "text-red-500" : ""} />
              <span className="ml-2">
                {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              </span>
            </Button>
          )}
        </div>
      </section>

      {/* Video Modal */}
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
