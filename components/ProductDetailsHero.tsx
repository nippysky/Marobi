// /components/ProductDetailHero.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Session } from "next-auth";
import type { Product } from "@/lib/products";

import { BiCategory } from "react-icons/bi";
import { BadgeCheck, Heart, Play, Tag } from "lucide-react";
import { BsBag } from "react-icons/bs";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { VideoModal } from "./YoutubeVideoModal";
import OptionSelectors from "./OptionSelectors";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";

interface Props {
  product: Product;
  user: Session["user"] | null;
  categoryName: string;
}

const ProductDetailHero: React.FC<Props> = ({
  product,
  user,
  categoryName,
}) => {
  // avoid SSR/client mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // unique color list
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color))),
    [product.variants]
  );

  // image gallery
  const [featuredImage, setFeaturedImage] = useState<string>(
    product.images[0] || ""
  );
  const [imgLoading, setImgLoading] = useState(true);
  const moreImages = product.images.slice(1);

  // video
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const router = useRouter();
  const { openSizeChart } = useSizeChart();
  const addToCart = useCartStore((s) => s.addToCart);

  // wishlist hooks (don’t call inside)
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const isWishlisted = useWishlistStore((s) =>
    s.isWishlisted(product.id)
  );

  const { currency } = useCurrency();
  const rawPrice = product.prices[currency];
  const currentPrice = formatAmount(rawPrice, currency);

  // stock & sizes
  const totalStock = product.variants.reduce(
    (sum, v) => sum + v.inStock,
    0
  );
  const outOfStock = totalStock === 0;
  const sizesForColor = (color: string) =>
    Array.from(
      new Set(
        product.variants
          .filter((v) => v.color === color)
          .map((v) => v.size)
      )
    );

  // selection state
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [customSize, setCustomSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const sizeToUse =
    product.sizeMods && customSize ? customSize : selectedSize;

  const validate = () => {
    if (outOfStock) {
      toast.error("Out of stock");
      return false;
    }
    if (product.variants.length > 0 && !selectedColor) {
      toast.error("Select a color");
      return false;
    }
    if (product.sizeMods && !customSize) {
      toast.error("Enter a custom size");
      return false;
    }
    if (!product.sizeMods && product.variants.length > 0 && !sizeToUse) {
      toast.error("Select a size");
      return false;
    }
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!validate()) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedColor, sizeToUse);
    }
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    addToCart(product, selectedColor, sizeToUse);
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

  return (
    <>
      <section className="grid lg:grid-cols-2 gap-10 mt-10">
        {/* IMAGE */}
        <div className="relative w-full aspect-[4/5] rounded-lg bg-gray-100 overflow-hidden">
          <Skeleton className={`absolute inset-0 ${imgLoading ? "" : "hidden"}`} />
          <Image
            src={featuredImage}
            alt={product.name}
            fill
            className="object-cover"
            onLoad={() => setImgLoading(false)}
            priority
          />
        </div>

        {/* DETAILS */}
        <div className="space-y-6">
          {/* THUMBNAILS + VIDEO */}
          {moreImages.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-gray-700">More Photos</p>
              <div className="grid grid-cols-3 gap-3">
                {moreImages.map((url) => (
                  <button
                    key={url}
                    onClick={() => {
                      setFeaturedImage(url);
                      setImgLoading(true);
                    }}
                    className={`relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 ${
                      featuredImage === url ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setIsVideoOpen(true)}>
                <Play className="mr-2" /> Play Video
              </Button>
            </div>
          )}

          {/* CATEGORY / STOCK / SIZE CHART */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm text-gray-700">
            <a href={`/categories/${product.category}`} className="flex items-center gap-1 underline">
              <BiCategory /> {categoryName}
            </a>
            {product.sizeMods && (
              <button onClick={openSizeChart} className="flex items-center gap-1 underline">
                <Tag /> Custom Size
              </button>
            )}
            <div className="flex items-center gap-1">
              <BadgeCheck className={outOfStock ? "text-red-600" : ""} />
              {outOfStock ? "Out of stock" : `${totalStock} in stock`}
            </div>
          </div>

          {/* NAME & DESC */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* PRICE */}
          <div className="text-3xl font-bold text-gray-900">{currentPrice}</div>

          {/* OPTIONS */}
          {product.variants.length > 0 && (
            <OptionSelectors
              colors={colors}
              sizes={sizesForColor(selectedColor)}
              maxQuantity={totalStock}
              selectedColor={selectedColor}
              onColorChange={(c) => {
                setSelectedColor(c);
                setSelectedSize("");
              }}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              selectedQuantity={quantity}
              onQuantityChange={setQuantity}
            />
          )}

          {/* CUSTOM SIZE FIELD */}
          {product.sizeMods && (
            <input
              type="text"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              placeholder="Enter custom size"
              className="w-full rounded border px-3 py-2"
            />
          )}

          {/* ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <Button onClick={handleBuyNow} disabled={outOfStock}>
              <Tag className="mr-2" /> Buy Now
            </Button>
            <Button variant="outline" onClick={handleAdd} disabled={outOfStock}>
              <BsBag className="mr-2" /> Add to Cart
            </Button>
          </div>

          {/* WISHLIST */}
          {user && mounted && (
            <Button variant="secondary" className="mt-4" onClick={toggleWishlist}>
              <Heart className={isWishlisted ? "text-red-500" : ""} />{" "}
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>
          )}
        </div>
      </section>

      {/* VIDEO MODAL */}
      {isVideoOpen && <VideoModal onClose={() => setIsVideoOpen(false)} videoId={product.videoId || ""} />}
    </>
  );
};

export default ProductDetailHero;
