"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, TrashIcon, Plus, Minus } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { BsBag } from "react-icons/bs";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export function CartSheet() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items) as CartItem[];
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalItemsCount = useCartStore((s) => s.totalItems());
  const distinctCount = useCartStore((s) => s.totalDistinctItems());
  const totalAmount = useCartStore((s) => s.totalAmount());
  const rawTotalWeight = useCartStore((s) => s.totalWeight());
  const { currency } = useCurrency();

  const totalWeight = Number.isFinite(rawTotalWeight) ? rawTotalWeight : 0;
  const formattedTotal = formatAmount(totalAmount, currency);
  const formattedWeight = `${totalWeight.toFixed(3)}kg`;

  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});

  const setPending = useCallback((key: string, v: boolean) => {
    setPendingMap((prev) => ({ ...prev, [key]: v }));
  }, []);

  const handleDecrease = useCallback(
    (item: CartItem, stock: number, key: string) => {
      updateQuantity(
        item.product.id,
        item.color,
        item.size,
        item.quantity - 1,
        item.customMods,
        item.hasSizeMod
      );
      setPending(key, true);
      setTimeout(() => setPending(key, false), 250);
    },
    [updateQuantity, setPending]
  );

  const handleIncrease = useCallback(
    (item: CartItem, stock: number, key: string) => {
      updateQuantity(
        item.product.id,
        item.color,
        item.size,
        item.quantity + 1,
        item.customMods,
        item.hasSizeMod
      );
      setPending(key, true);
      setTimeout(() => setPending(key, false), 250);
    },
    [updateQuantity, setPending]
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-gray-600 hover:text-gray-800">
          <BsBag className="w-5 h-5" />
          {mounted && distinctCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {distinctCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full md:w-[400px] max-w-full flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center bg-gray-50">
            <BsBag className="w-16 h-16 mb-4 text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Your cart is empty
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Browse our products and add items to your cart.
            </p>
            <Link href="/all-products" className="w-full max-w-xs">
              <Button className="w-full">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4">
              {items.map((item, idx) => {
                const {
                  product,
                  quantity,
                  color,
                  size,
                  customMods,
                  price,
                  hasSizeMod,
                  sizeModFee,
                  unitWeight = 0,
                } = item;
                const formattedUnit = formatAmount(price, currency);
                const variant = product.variants.find(
                  (v: any) => v.color === color && v.size === size
                ) as any | undefined;
                const stock =
                  variant && typeof variant.inStock === "number"
                    ? variant.inStock
                    : variant && typeof (variant as any).stock === "number"
                    ? (variant as any).stock
                    : Infinity;

                const key = `${product.id}-${color}-${size}-${idx}`;
                const isPending = Boolean(pendingMap[key]);

                const lineWeight = Number.isFinite(unitWeight)
                  ? parseFloat((unitWeight * quantity).toFixed(3))
                  : 0;

                return (
                  <div
                    key={key}
                    className="py-4"
                    aria-busy={isPending}
                    aria-label={`Cart item ${product.name}`}
                  >
                    <div className="flex items-start gap-3">
                      <Link
                        href={`/product/${product.id}`}
                        className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden bg-gray-100"
                      >
                        {product.images[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </Link>
                      <div className="flex-1">
                        <Link
                          href={`/product/${product.id}`}
                          className="text-sm font-medium text-gray-900 hover:underline"
                          title={product.name}
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-600">
                            {formattedUnit} each
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                handleDecrease(item, stock, key)
                              }
                              disabled={isPending}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <div className="relative w-8 flex justify-center">
                              <span
                                className={clsx(
                                  "text-sm font-medium w-full text-center",
                                  isPending && "opacity-50"
                                )}
                              >
                                {quantity}
                              </span>
                              {isPending && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-4 h-4 animate-spin border border-gray-300 border-t-transparent rounded-full" />
                                </div>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                handleIncrease(item, stock, key)
                              }
                              disabled={quantity >= stock || isPending}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Color: <span className="font-medium">{color}</span> |{" "}
                          Size: <span className="font-medium">{size}</span>
                        </div>
                        {hasSizeMod && (
                          <div className="text-xs text-yellow-600 mt-1">
                            +5% size-mod fee:{" "}
                            <span className="font-medium">
                              {formatAmount(sizeModFee, currency)}
                            </span>
                          </div>
                        )}
                        {customMods && Object.keys(customMods).length > 0 && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600">
                            {Object.entries(customMods).map(([k, v]) => (
                              <div key={k} className="flex">
                                <span className="font-medium capitalize mr-1">
                                  {k
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (c) => c.toUpperCase())}
                                  :
                                </span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Weight info per line */}
                        <div className="mt-1 text-xs text-gray-600">
                          <div>
                            Unit weight: {Number.isFinite(unitWeight) ? unitWeight.toFixed(3) : "0.000"}kg
                          </div>
                          <div>
                            Total weight: {lineWeight.toFixed(3)}kg
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          removeFromCart(
                            product.id,
                            color,
                            size,
                            customMods,
                            hasSizeMod
                          )
                        }
                        className="ml-2 p-1 text-red-500 hover:text-red-700"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    {idx < items.length - 1 && (
                      <hr className="mt-4 border-gray-200" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 left-0 p-4 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  Total:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formattedTotal}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  Total Weight:
                </span>
                <span className="text-sm text-gray-700">{formattedWeight}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="ghost"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={clearCart}
                  aria-label="Clear all cart"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button className="flex-1" onClick={() => router.push("/checkout")}>
                  Proceed
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
