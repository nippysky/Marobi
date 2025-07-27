"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Session } from "next-auth";
import type { Product } from "@/lib/products";
import { BiCategory, BiBadgeCheck } from "react-icons/bi";
import { Heart, Play, Tag } from "lucide-react";
import { BsBag } from "react-icons/bs";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { VideoModal } from "./YoutubeVideoModal";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useCartStore } from "@/lib/store/cartStore";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Props {
  product: Product;
  user: Session["user"] | null;
  categoryName: string;
}

const ProductDetailHero: React.FC<Props> = ({ product, user, categoryName }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Gallery logic
  const [featuredImage, setFeaturedImage] = useState(product.images[0] || "");
  const [imgLoading, setImgLoading] = useState(true);

  // Media (main + rest)
  const media = [...product.images];
  const hasVideo = !!product.videoUrl;

  // Variant logic
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color))),
    [product.variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size))),
    [product.variants]
  );

  const hasColor = colors.length > 1 || (colors.length === 1 && colors[0] !== "");
  const hasSize = sizes.length > 1 || (sizes.length === 1 && sizes[0] !== "");

  // Initial selected color/size
  const [selectedColor, setSelectedColor] = useState<string>(
    hasColor ? colors[0] : ""
  );

  // Only show sizes for that color
  const availableSizes = useMemo(
    () =>
      hasColor
        ? Array.from(
            new Set(
              product.variants.filter((v) => v.color === selectedColor).map((v) => v.size)
            )
          )
        : sizes,
    [hasColor, product.variants, selectedColor, sizes]
  );

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || "");

  // When selectedColor changes, reset size
  useEffect(() => {
    setSelectedSize(availableSizes[0] || "");
  }, [selectedColor, availableSizes]);

  // Find inStock for selected
  const selectedVariant = product.variants.find(
    (v) =>
      (!hasColor || v.color === selectedColor) &&
      (!hasSize || v.size === selectedSize)
  );
  const inStock = selectedVariant?.inStock ?? 0;
  const outOfStock = inStock === 0;

  // Quantity
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setQuantity(inStock === 0 ? 1 : Math.min(quantity, inStock));
  }, [selectedColor, selectedSize, inStock]);

  // Custom size
  const { openSizeChart } = useSizeChart();
  const [customSize, setCustomSize] = useState("");
  const enableSizeMod = product.sizeMods;

  // Pricing
  const { currency } = useCurrency();
  const price = product.prices[currency] ?? Object.values(product.prices)[0] ?? 0;
  const currentPrice = formatAmount(price, currency);

  // Cart
  const addToCart = useCartStore((s) => s.addToCart);

  // Wishlist API simulation
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  useEffect(() => {
    if (user && product.id) {
      // fetch from `/api/wishlist/${product.id}` returns { wishlisted: boolean }
      fetch(`/api/wishlist/${product.id}`)
        .then((r) => r.json())
        .then((d) => setIsWishlisted(d.wishlisted))
        .catch(() => setIsWishlisted(false));
    }
  }, [user, product.id]);
  const toggleWishlist = async () => {
    if (!user) return toast.error("Sign in to use wishlist");
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
        setIsWishlisted(false);
        toast("Removed from wishlist");
      } else {
        await fetch(`/api/wishlist/${product.id}`, { method: "POST" });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Error updating wishlist");
    }
    setWishlistLoading(false);
  };

  // Router
  const router = useRouter();

  // Video modal
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Validation for cart
  function validate() {
    if (outOfStock) {
      toast.error("Out of stock");
      return false;
    }
    if (hasColor && !selectedColor) {
      toast.error("Select a color");
      return false;
    }
    if (enableSizeMod && !customSize) {
      toast.error("Enter a custom size");
      return false;
    }
    if (hasSize && !selectedSize && !enableSizeMod) {
      toast.error("Select a size");
      return false;
    }
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return false;
    }
    return true;
  }

  const handleAddToCart = () => {
    if (!validate()) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedColor, enableSizeMod ? customSize : selectedSize);
    }
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    addToCart(product, selectedColor, enableSizeMod ? customSize : selectedSize, quantity);
    router.push("/checkout");
  };

  // Media click
  function handleThumbnailClick(media: string) {
    setFeaturedImage(media);
    setImgLoading(true);
  }

  return (
    <section className="grid lg:grid-cols-2 gap-10 mt-10">
      {/* IMAGE */}
      <div className="relative w-full aspect-[4/5] rounded-lg bg-gray-100 overflow-hidden">
        <Skeleton className={`absolute inset-0 ${imgLoading ? "" : "hidden"}`} />
        {featuredImage && (
          <Image
            src={featuredImage}
            alt={product.name}
            fill
            className="object-cover"
            onLoad={() => setImgLoading(false)}
            priority
          />
        )}
      </div>

      {/* DETAILS */}
      <div className="space-y-6">
        {/* Media Gallery */}
        {media.length > 1 || hasVideo ? (
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Media</p>
            <div className="grid grid-cols-4 gap-3">
              {media.map((url, i) => (
                <button
                  key={url}
                  onClick={() => handleThumbnailClick(url)}
                  className={`relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 border ${
                    featuredImage === url ? "ring-2 ring-indigo-500" : ""
                  }`}
                  tabIndex={0}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
              {hasVideo && (
                <button
                  onClick={() => setIsVideoOpen(true)}
                  className={`flex items-center justify-center rounded-lg bg-gray-200 border aspect-[4/5]`}
                  tabIndex={0}
                  aria-label="View video"
                >
                  <Play className="w-8 h-8" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* CATEGORY / STOCK / SIZE CHART */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm text-gray-700">
          <a
            href={`/categories/${product.category}`}
            className="flex items-center gap-1 underline"
          >
            <BiCategory /> {categoryName}
          </a>
          {enableSizeMod && (
            <button
              onClick={openSizeChart}
              className="flex items-center gap-1 underline"
              type="button"
            >
              <Tag /> Custom Size
            </button>
          )}
          <div className="flex items-center gap-1">
            <BiBadgeCheck className={outOfStock ? "text-red-600" : ""} />
            <span className={outOfStock ? "text-red-600 font-semibold" : ""}>
              {outOfStock ? "Out of stock" : `${inStock} in stock`}
            </span>
          </div>
        </div>

        {/* NAME & DESC */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>
        </div>

        {/* PRICE */}
        <div className="text-3xl font-bold text-gray-900">{currentPrice}</div>

        {/* VARIANT SELECTORS */}
        <div className="flex flex-col gap-4">
          {hasColor && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Color</label>
              <Select
                value={selectedColor}
                onValueChange={(c) => setSelectedColor(c)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasSize && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Size</label>
              <Select
                value={selectedSize}
                onValueChange={setSelectedSize}
                disabled={!selectedColor && hasColor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {enableSizeMod && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Custom Size</label>
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Enter your custom size"
                className="w-full rounded border px-3 py-2"
              />
            </div>
          )}
        </div>

        {/* QUANTITY */}
        {!outOfStock && (
          <div className="flex items-center gap-3 mt-2">
            <label className="text-sm text-gray-700">Quantity:</label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                tabIndex={0}
              >
                -
              </Button>
              <span className="min-w-[2ch] text-center">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(q + 1, inStock))}
                disabled={quantity >= inStock}
                tabIndex={0}
              >
                +
              </Button>
            </div>
          </div>
        )}
        {outOfStock && (
          <div className="text-red-600 font-semibold mt-2">This variant is out of stock</div>
        )}

        {/* ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="w-full"
          >
            <Tag className="mr-2" /> Buy Now
          </Button>
          <Button
            variant="outline"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-full"
          >
            <BsBag className="mr-2" /> Add to Cart
          </Button>
        </div>

        {/* WISHLIST */}
        {user && mounted && (
          <Button
            variant={isWishlisted ? "destructive" : "secondary"}
            className="mt-4 w-full"
            onClick={toggleWishlist}
            disabled={wishlistLoading}
          >
            <Heart className={isWishlisted ? "text-red-500" : ""} />{" "}
            {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          </Button>
        )}
      </div>
      {/* VIDEO MODAL */}
      {isVideoOpen && product.videoUrl && (
        <VideoModal
          onClose={() => setIsVideoOpen(false)}
          videoId={product.videoUrl}
        />
      )}
    </section>
  );
};

export default ProductDetailHero;
