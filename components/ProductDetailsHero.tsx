"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Session } from "next-auth";
import type { Product } from "@/lib/products";
import {
  CheckCircle,
  Heart,
  LayoutGrid,
  PencilRuler,
  Play,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BsBag } from "react-icons/bs";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { VideoModal } from "./VideoModal";
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
import { Switch } from "./ui/switch";

// ---- Custom size fields
const CUSTOM_SIZE_FIELDS = [
  { name: "chest", label: "Chest/Bust (in)" },
  { name: "waist", label: "Waist (in)" },
  { name: "hip", label: "Hip (in)" },
  { name: "length", label: "Length (in)" }, 
];

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
  // mounted flag for wishlist
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // featured image & loading
  const media = [...product.images];
  const [featuredImage, setFeaturedImage] = useState(media[0]);
  const [imgLoading, setImgLoading] = useState(true);

  // slider ref
  const thumbsRef = useRef<HTMLDivElement>(null);
  const scrollThumbs = (dir: "left" | "right") => {
    if (thumbsRef.current) {
      const w = thumbsRef.current.clientWidth;
      thumbsRef.current.scrollBy({ left: dir === "left" ? -w : w, behavior: "smooth" });
    }
  };

  // video modal
  const hasVideo = !!product.videoUrl;
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // stock & link
  const totalStock = useMemo(
    () => product.variants.reduce((sum, v) => sum + (v.inStock || 0), 0),
    [product.variants]
  );

  // color/size selectors
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color))),
    [product.variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size))),
    [product.variants]
  );
  const hasColor = colors.length > 1 || colors[0] !== "";
  const hasSize = sizes.length > 1 || sizes[0] !== "";

  const [selectedColor, setSelectedColor] = useState(
    hasColor ? colors[0] : ""
  );
  const availableSizes = useMemo(
    () =>
      hasColor
        ? Array.from(
            new Set(
              product.variants
                .filter((v) => v.color === selectedColor)
                .map((v) => v.size)
            )
          )
        : sizes,
    [hasColor, product.variants, selectedColor, sizes]
  );
  const [selectedSize, setSelectedSize] = useState(
    availableSizes[0] || ""
  );
  useEffect(() => {
    setSelectedSize(availableSizes[0] || "");
  }, [availableSizes]);

  // custom mods
  const enableSizeMod = product.sizeMods;
  const [customSizeEnabled, setCustomSizeEnabled] = useState(false);
  const [customMods, setCustomMods] = useState<Record<string, string>>({});

  // find variant & stock
  const selectedVariant = product.variants.find(
    (v) =>
      (!hasColor || v.color === selectedColor) &&
      (!hasSize || v.size === selectedSize)
  );
  const inStock = selectedVariant?.inStock ?? totalStock;
  const outOfStock = inStock === 0;

  // quantity
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), inStock || 1));
  }, [selectedColor, selectedSize, inStock]);

  // size chart
  const { openSizeChart } = useSizeChart();

  // pricing
  const { currency } = useCurrency();
// 1) Determine the base price (in current currency)
const basePrice =
  product.prices[currency] ??
  Object.values(product.prices)[0] ??
  0;

// 2) Compute the 5% size‑mod fee (only if enabled)
const sizeModFee = customSizeEnabled
  ? parseFloat((basePrice * 0.05).toFixed(2))
  : 0;

// 3) Add it to the base price, then format for display
const finalPrice = parseFloat(
  (basePrice + sizeModFee).toFixed(2)
);
const currentPrice = formatAmount(finalPrice, currency);


  // cart
  const addToCart = useCartStore((s) => s.addToCart);

  // wishlist
  const [wishLoading, setWishLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  useEffect(() => {
    if (user && product.id) {
      fetch(`/api/account/wishlist/${product.id}`)
        .then((r) => r.json())
        .then((d) => setIsWishlisted(d.wishlisted))
        .catch(() => setIsWishlisted(false));
    }
  }, [user, product.id]);
  const toggleWishlist = async () => {
    if (!user) return toast.error("Sign in to use wishlist");
    setWishLoading(true);
    try {
      if (isWishlisted) {
        await fetch(`/api/account/wishlist/${product.id}`, { method: "DELETE" });
        setIsWishlisted(false);
        toast("Removed from wishlist");
      } else {
        await fetch(`/api/account/wishlist/${product.id}`, { method: "POST" });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Error updating wishlist");
    }
    setWishLoading(false);
  };

  // router
  const router = useRouter();

  // validation
  const validate = () => {
    if (outOfStock) return toast.error("Out of stock"), false;
    if (hasColor && !selectedColor)
      return toast.error("Select a color"), false;
    if (hasSize && !selectedSize)
      return toast.error("Select a size"), false;
    if (quantity < 1)
      return toast.error("Quantity must be at least 1"), false;
    if (customSizeEnabled) {
      const any = CUSTOM_SIZE_FIELDS.some(
        (f) => customMods[f.name]?.trim()
      );
      if (!any)
        return toast.error("Enter at least one custom measurement"), false;
    }
    return true;
  };
const handleAddToCart = () => {
  if (!validate()) return;
  addToCart({
    product,
    color: selectedColor,
    size: selectedSize,
    quantity,
    price:     finalPrice,
    hasSizeMod: customSizeEnabled,
    sizeModFee,
    customMods: customSizeEnabled ? customMods : undefined,
  });
  toast.success("Added to cart");
};

const handleBuyNow = () => {
  if (!validate()) return;
  addToCart({
    product,
    color: selectedColor,
    size: selectedSize,
    quantity,
    price:     finalPrice,
    hasSizeMod: customSizeEnabled,
    sizeModFee,
    customMods: customSizeEnabled ? customMods : undefined,
  });
  router.push("/checkout");
};

  // cycle featured
  const idx = media.findIndex((m) => m === featuredImage);
  const prevMedia = () => {
    const i = (idx - 1 + media.length) % media.length;
    setFeaturedImage(media[i]);
    setImgLoading(true);
  };
  const nextMedia = () => {
    const i = (idx + 1) % media.length;
    setFeaturedImage(media[i]);
    setImgLoading(true);
  };

  return (
    <section className="grid lg:grid-cols-2 gap-10 mt-10">
      {/* MAIN IMAGE */}
      <div className="relative w-full max-w-xl mx-auto aspect-[4/5] rounded-lg bg-gray-100 overflow-hidden">
        <Skeleton
          className={`absolute inset-0 ${imgLoading ? "" : "hidden"}`}
        />
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
        {media.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute inset-y-0 left-0 px-2 bg-black/20 hover:bg-black/30 text-white flex items-center"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextMedia}
              className="absolute inset-y-0 right-0 px-2 bg-black/20 hover:bg-black/30 text-white flex items-center"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* DETAILS */}
      <div className="space-y-6 w-full">
        {/* MEDIA GRID */}
        {media.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Media</p>
            <div className="relative">
              {media.length > 4 && (
                <button
                  onClick={() => scrollThumbs("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/80 hover:bg-white rounded-r"
                  aria-label="Scroll media left"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div
                ref={thumbsRef}
                className="grid grid-flow-col auto-cols-[25%] gap-3 overflow-x-auto scroll-smooth no-scrollbar"
              >
                {media.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => {
                      setFeaturedImage(url);
                      setImgLoading(true);
                    }}
                    className={`relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 border ${
                      featuredImage === url
                        ? "ring-2 ring-brand"
                        : ""
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
              {media.length > 4 && (
                <button
                  onClick={() => scrollThumbs("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/80 hover:bg-white rounded-l"
                  aria-label="Scroll media right"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            {hasVideo && (
              <Button
                variant="outline"
                className="my-5 w-full"
                onClick={() => setIsVideoOpen(true)}
              >
                <Play className="mr-2" /> Play Video
              </Button>
            )}
          </div>
        )}

        {/* CATEGORY / SIZE CHART / STOCK */}
        <div className="flex flex-wrap lg:gap-20 gap-10 text-sm text-gray-700">
          <a
            href={`/categories/${product.category}`}
            className="flex items-center gap-1 underline"
          >
            <LayoutGrid /> {categoryName}
          </a>
          <button
            onClick={openSizeChart}
            className="flex items-center gap-1 underline"
            type="button"
          >
            <PencilRuler /> Size Chart
          </button>
          <div className="flex items-center gap-1">
            <CheckCircle />
            <span className="font-semibold">{totalStock}</span> in stock
          </div>
        </div>

        {/* NAME & DESC */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {product.name}
          </h1>
          <p className="text-gray-600">{product.description}</p>
        </div>

        {/* PRICE */}
        <div className="text-3xl font-bold text-gray-900">
          {currentPrice}
        </div>
        <div className="text-sm text-gray-500">
  {customSizeEnabled && (
    <>
      <span>+5% custom‑size fee:</span>{" "}
      <strong>
        {formatAmount(sizeModFee, currency)}
      </strong>
    </>
  )}
</div>


        {/* SELECTORS */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:gap-4 gap-4">
            {hasColor && (
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">
                  Color
                </label>
                <Select
                  value={selectedColor}
                  onValueChange={setSelectedColor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {hasSize && (
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">
                  Size
                </label>
                <Select
                  value={selectedSize}
                  onValueChange={setSelectedSize}
                  disabled={hasColor && !selectedColor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {enableSizeMod && (
              <div className="flex-1 flex flex-col justify-end">
                <label className="block text-sm text-gray-700 mb-1">
                  Custom Size Mods
                </label>
                <Switch
                  checked={customSizeEnabled}
                  onCheckedChange={(v) => {
                    setCustomSizeEnabled(v);
                    if (!v) setCustomMods({});
                  }}
                />
              </div>
            )}
          </div>

          {customSizeEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CUSTOM_SIZE_FIELDS.map((f) => (
                <div key={f.name} className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={customMods[f.name] ?? ""}
                    onChange={(e) =>
                      setCustomMods((m) => ({
                        ...m,
                        [f.name]: e.target.value,
                      }))
                    }
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-2">
            <label className="block text-sm text-gray-700">Quantity</label>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              –
            </Button>
            <span className="w-6 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.min(q + 1, inStock))}
              disabled={quantity >= inStock}
            >
              +
            </Button>
            <span className="ml-2 text-xs text-gray-500">
              {inStock} left
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button className="bg-gradient-to-r from-brand to-green-700" onClick={handleBuyNow} disabled={outOfStock}>
            <Tag className="mr-2" /> Buy Now
          </Button>
          <Button
            variant="outline"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <BsBag className="mr-2" /> Add to Cart
          </Button>
        </div>

        {/* WISHLIST */}
        {user && mounted && (
          <Button
            variant={isWishlisted ? "outline" : "secondary"}
            className={`mt-3 w-full ${isWishlisted ? "text-red-500" : ""}`}
            onClick={toggleWishlist}
            disabled={wishLoading}
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
          videoUrl={product.videoUrl}
        />
      )}
    </section>
  );
};

export default ProductDetailHero;
