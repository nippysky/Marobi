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
import { useCurrency } from "@/lib/context/currencyContext";
import { useAccountModal } from "@/lib/context/accountModalContext";

// If you have a User type in your session utility, import it:
import type { User } from "@/lib/session";
import { formatAmount } from "@/lib/formatCurrency";
import { Skeleton } from "./ui/skeleton";

interface ProductDetailHeroProps {
  product: Product;
  user: User | null;
}

export const ProductDetailHero: React.FC<ProductDetailHeroProps> = ({
  product,
  user,
}) => {
  const [featuredImage, setFeaturedImage] = useState(product.imageUrl);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

       const [imgLoading, setImgLoading] = useState(true);

  const router = useRouter();
  const { openSizeChart } = useSizeChart();
  const addToCart = useCartStore((s) => s.addToCart);
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));

  const { currency } = useCurrency();
  const { openModal: openAccountModal } = useAccountModal();

  // Compute price vs discount/base
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

  // prepare dynamic variant choices
  const colors = product.variants.map((v) => v.color);
  const sizesForColor = (color: string) => {
    const v = product.variants.find((v) => v.color === color);
    return v ? v.sizes.map((s) => s.size) : [];
  };

  // local selectors
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [customSize, setCustomSize] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // choose size: either a selected or a custom
  const sizeToUse =
    product.isSizeModifiable && customSize ? customSize : selectedSize;

  const validate = () => {
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

  const handleAddToWishlist = () => {
    // if you want to gate login here:
    if (!user) {
      openAccountModal();
      return;
    }
    if (!isWishlisted) {
      addToWishlist(product);
      toast.success("Added to wishlist");
    } else {
      toast.error("Already in wishlist");
    }
  };

  const categoryMeta = getCategoryBySlug(product.category);
  const categoryName = categoryMeta ? categoryMeta.name : product.category;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
        {/* ─── Featured Image */}
        <div className="relative w-full aspect-[4/5] rounded-lg bg-gray-100 overflow-hidden">

   

<Skeleton
  className={`
    absolute inset-0 h-full w-full
    ${imgLoading ? "visible" : "hidden"}
  `}
/>

          <Image
            src={featuredImage}
              onLoad={() => setImgLoading(false)}
            alt={product.name}
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
        </div>

        {/* ─── Details Column */}
        <div className="flex flex-col space-y-6">
          {/* More Photos */}
          <div className="space-y-2">
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              More Photos
            </p>
            <div className="grid grid-cols-3 gap-3">
              {product.moreImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedImage(url)}
                  className={`
                    relative w-full aspect-[4/5] rounded-lg bg-gray-100
                    ${
                      featuredImage === url
                        ? "ring-2 ring-green-500"
                        : ""
                    }
                  `}
                >
                  <Image
                    src={url}
                    alt={`${product.name} thumb ${idx + 1}`}
                    fill
                    className="object-cover rounded-lg"
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

          {/* Category / Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-5 text-sm text-gray-700 dark:text-gray-300 mt-5">
            <Link
              href={`/categories/${product.category}`}
              className="flex items-center gap-1 underline"
            >
              <BiCategory className="w-7 h-7" />
              <p className="text-[1rem] uppercase font-semibold tracking-wider truncate">

              {categoryName}
              </p>
            </Link>
            <button
              onClick={openSizeChart}
              className="flex items-center gap-1 underline"
            >
              <PencilRuler className="w-7 h-7" />
                  <p className="text-[1rem] uppercase font-semibold tracking-wider">

              Size Chart
                  </p>
            </button>
            <div className="flex items-center gap-1">
              <BadgeCheck className="w-7 h-7" />
                  <p className="text-[1rem] uppercase font-semibold tracking-wider">

              {product.variants
                .flatMap((v) => v.sizes)
                .reduce((sum, s) => sum + s.inStock, 0)}{" "}
              in Stock
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

          {/* Option Selectors */}
          <OptionSelectors
            sizes={sizesForColor(selectedColor)}
            colors={colors}
            maxQuantity={product.variants
              .flatMap((v) => v.sizes)
              .reduce((sum, s) => sum + s.inStock, 0)}
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

          {/* Custom Size Field */}
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
                className="mt-1 block w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:ring focus:ring-green-200"
              />
            </div>
          )}

          {/* Actions */}
          <section className="w-full">
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                className="w-full text-sm"
                onClick={handleBuyNow}
                disabled={!selectedColor || !sizeToUse || selectedQuantity < 1}
              >
                <Tag /> Buy Now
              </Button>
              <Button
                className="w-full text-sm"
                variant="outline"
                onClick={handleAddToCart}
                disabled={!selectedColor || !sizeToUse || selectedQuantity < 1}
              >
                Add to Cart
              </Button>
            </div>

            {/* Wishlist (only if logged in) */}
            {user && (
              <Button
                className="w-full mt-5 text-sm"
                variant="secondary"
                onClick={handleAddToWishlist}
                disabled={isWishlisted}
              >
                <Heart /> {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
              </Button>
            )}
          </section>
        </div>
      </div>

      {isVideoOpen && (
        <VideoModal
          onClose={() => setIsVideoOpen(false)}
          videoId="klKVm1FALhs"
        />
      )}
    </>
  );
};

export default ProductDetailHero;
