"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
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
import { useExchangeRates } from "@/lib/hooks/useExchangeRates";
import { formatAmount } from "@/lib/formatCurrency";

export function CartSheet() {
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cart store
  const items = useCartStore((s) => s.items);
  const totalItemsCount = useCartStore((s) => s.totalItems());
  const totalAmountValue = useCartStore((s) => s.totalAmount());
  const removeFromCart = useCartStore((s) => s.removeFromCart);

  // Currency + exchange‐rates
  const { currency } = useCurrency();
  const { convertFromNgn, isFetching } = useExchangeRates();

  // Converted cart total
  const convertedTotal = isFetching
    ? null
    : formatAmount(convertFromNgn(totalAmountValue, currency), currency);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
          <BsBag className="w-5 h-5" />
          {mounted && totalItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {totalItemsCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* ─── Cart Items ─── */}
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <div className="flex flex-col space-y-4">
                {items.map(({ product, quantity, color, size }: CartItem) => {
                  // Convert each unit price
                  const convertedItemPrice = isFetching
                    ? null
                    : formatAmount(
                        convertFromNgn(product.price, currency),
                        currency
                      );

                  return (
                    <div
                      key={`${product.id}-${color}-${size}`}
                      className="flex items-start bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    >
                      {/* Clickable area → product details */}
                      <Link
                        href={`/product/${product.id}`}
                        className="flex-1 flex items-start space-x-3 p-3"
                      >
                        {/* Product image */}
                        <div className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Text details */}
                        <div className="flex-1 flex flex-col">
                          <p
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1"
                            title={product.name}
                          >
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {isFetching ? (
                              <span>…</span>
                            ) : (
                              <>
                                {convertedItemPrice} × {quantity}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Color: <span className="font-medium">{color}</span>{" "}
                            | Size: <span className="font-medium">{size}</span>
                          </p>
                        </div>
                      </Link>

                      {/* Remove button */}
                      <button
                        onClick={() => removeFromCart(product.id, color, size)}
                        className="m-3 p-1 text-gray-500 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Total & Checkout ─── */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {isFetching ? <span>…</span> : <>Total: {convertedTotal}</>}
              </p>
              <Button
                className="w-full mt-3"
                onClick={() => {
                  /* e.g. router.push("/checkout") */
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
