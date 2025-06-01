// components/WishlistList.tsx
"use client";

import React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import ProductCard from "@/components/shared/product-card";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { Button } from "./ui/button";

export default function WishlistList() {
  const wishlistItems = useWishlistStore((s) => s.items);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);

  if (wishlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <p className="text-lg">Your wishlist is empty.</p>
        <p className="mt-2 text-center">Browse products and click “Add to Wishlist” to save them here.</p>
        <Link href={"/all-products"} className="mt-4" passHref>
        <Button>View Our Catagloue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {wishlistItems.map((product) => (
        <div key={product.id} className="relative group">
          {/* Remove-from-wishlist button */}
          <button
            onClick={() => removeFromWishlist(product.id)}
            className="absolute top-2 right-2 z-10 p-1 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Remove from wishlist"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Entire card is clickable */}
          <Link href={`/products/${product.id}`} className="block">
        
              <ProductCard product={product} />
      
          </Link>
        </div>
      ))}
    </div>
  );
}
