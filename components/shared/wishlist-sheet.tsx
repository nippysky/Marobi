"use client";

import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { Button } from "@/components/ui/button";

export const WishlistSheet = () => {
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((s) => s.items);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
          <Heart className="w-5 h-5" />
          {mounted && items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Your Wishlist</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Heart className="w-12 h-12 mb-2 opacity-50" />
            <p>Your wishlist is empty</p>
            <Link href="/all-products" className="mt-4">
              <Button>View All Products</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* ─── Wishlist Items ─── */}
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <div className="flex flex-col space-y-4">
                {items.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                  >
                    {/* Clickable → product detail */}
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 flex items-start space-x-3 p-3"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Text */}
                      <div className="flex-1 flex flex-col">
                        <p
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1"
                          title={product.name}
                        >
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          View Details →
                        </p>
                      </div>
                    </Link>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="m-3 p-1 text-gray-500 hover:text-red-600"
                      aria-label="Remove from wishlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Action Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                className="w-full"
                onClick={() => {
                  /* could push to a compare page, or export wishlist */
                }}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
