"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {  Trash2, TrashIcon } from "lucide-react";
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

export function CartSheet() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const { currency } = useCurrency();

  // Just use prices as per your schema/type
  const getEffectiveUnitPrice = (product: CartItem["product"]) =>
    product.prices[currency] ?? 0;

  // Totals
const totalItemsCount = useCartStore((s) => s.totalItems());
  const totalPriceValue = items.reduce(
    (sum, { product, quantity }) => sum + getEffectiveUnitPrice(product) * quantity,
    0
  );
  const formattedTotal = formatAmount(totalPriceValue, currency);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
          <BsBag className="w-5 h-5" />
          {mounted && totalItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {totalItemsCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full md:w-[400px] max-w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        {/* Cart is empty */}
        {items.length === 0 ? (
          <div className="flex flex-col flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
            <BsBag className="w-12 h-12 mb-2 opacity-50" />
            <p className="mb-2">Your cart is empty</p>
            <Link href="/all-products" className="mt-4">
        
              <Button>
                    <BsBag className="w-5 h-5 inline-block mr-1" />
                Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-1 py-4">
              <div className="flex flex-col gap-5">
                {items.map(({ product, quantity, color, size, customMods }: CartItem) => {
                  const unitPrice = getEffectiveUnitPrice(product);
                  const formattedUnit = formatAmount(unitPrice, currency);

                  return (
                    <div
                      key={`${product.id}-${color}-${size}-${JSON.stringify(customMods)}`}
                      className="flex gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                      {/* Product Image */}
                      <Link
                        href={`/product/${product.id}`}
                        className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden bg-gray-100"
                      >
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </Link>
                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between py-2 pr-2">
                        <div>
                          <Link
                            href={`/product/${product.id}`}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline"
                            title={product.name}
                          >
                            {product.name}
                          </Link>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {formattedUnit} × {quantity}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Color: <span className="font-medium">{color}</span>{" "}
                            | Size: <span className="font-medium">{size}</span>
                          </div>
                        </div>
                        {/* Custom Mods Grid */}
                        {customMods && Object.keys(customMods).length > 0 && (
                          <div className="mt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(customMods).map(([k, v]) => (
                                <div
                                  key={k}
                                  className="flex text-xs bg-gray-50 dark:bg-gray-700 rounded px-2 py-1"
                                >
                                  <span className="font-medium capitalize mr-1">
                                    {k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}:
                                  </span>
                                  <span>{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromCart(product.id, color, size, customMods)}
                        className="self-start m-2 p-1 text-red-500 hover:text-brand transition-colors"
                        aria-label="Remove item"
                        tabIndex={0}
                        type="button"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total & Checkout & Clear All */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0 left-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Total:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formattedTotal}
                </span>
              </div>
              <div className="flex gap-2 mt-5">
           
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
                  onClick={clearCart}
                  aria-label="Clear all cart"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>


                     <Button
                  className="flex-1"
                  onClick={() => router.push("/checkout")}
                >
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
