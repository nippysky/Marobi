"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingCart, X } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cartStore";
import { BsBag } from "react-icons/bs";

export function CartSheet() {
  // Local mounted flag to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get cart items array
  const items = useCartStore((s) => s.items);
  // Get computed totals as numbers
  const totalItemsCount = useCartStore((s) => s.totalItems());
  const totalAmountValue = useCartStore((s) => s.totalAmount());
  const removeFromCart = useCartStore((s) => s.removeFromCart);

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
            <div className="flex-1 divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="p-4 flex items-start">
                  <div className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <p
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1"
                      title={product.name}
                    >
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      NGN {product.price.toLocaleString()} × {quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="ml-2 p-1 text-gray-500 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Total: NGN {totalAmountValue.toLocaleString()}
              </p>
              <Button
                className="w-full mt-3"
                onClick={() => {
                  /* In production, route to /checkout here */
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
