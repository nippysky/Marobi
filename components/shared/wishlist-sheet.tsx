
"use client";

import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { Button } from "@/components/ui/button";

export const WishlistSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((s) => s.items);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] px-4">
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
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="flex items-start bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="flex-1 flex items-start space-x-3 p-3"
                  >
                    <div className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
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

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button className="w-full">Continue Shopping</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
