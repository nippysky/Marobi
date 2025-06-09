"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";
import ProductCard from "@/components/shared/product-card";
import { X } from "lucide-react";

export default function WishlistSection() {
  const items = useWishlistStore((s) => s.items);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const { currency } = useCurrency();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Wishlist</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="relative">
                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute z-10 top-2 right-2 rounded-full bg-white p-1 shadow hover:bg-red-50"
                  aria-label="Remove from wishlist"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                </button>

                <Link href={`/product/${item.id}`} className="block">
                  <ProductCard product={item} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-12">
            <p className="text-muted-foreground">Your wishlist is empty.</p>
            <Link href="/categories">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
