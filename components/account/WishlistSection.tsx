"use client";

import useSWR from "swr";
import Link from "next/link";
import { X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/context/currencyContext";
import { formatAmount } from "@/lib/formatCurrency";

interface WishlistItem {
  id: string;
  addedAt: string;
  product: {
    id: string;
    name: string;
    images: string[]; 
    category: string;
    priceNGN: number | null;
    priceUSD: number | null;
    priceEUR: number | null;
    priceGBP: number | null;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WishlistSection() {
  const { data: items, error, mutate } = useSWR<WishlistItem[]>(
    "/api/account/wishlist",
    fetcher
  );
  const { currency } = useCurrency();

  const remove = async (id: string) => {
    await fetch(`/api/account/wishlist/${id}`, { method: "DELETE" });
    mutate();
  };

  if (!items && !error) {
    return <p>Loading your wishlist…</p>;
  }
  if (error) {
    return <p className="text-red-600">Failed to load wishlist.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Wishlist</CardTitle>
      </CardHeader>
      <CardContent>
        {items!.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items!.map((item) => {
              const p = item.product;
              const priceNum =
                {
                  NGN: p.priceNGN,
                  USD: p.priceUSD,
                  EUR: p.priceEUR,
                  GBP: p.priceGBP,
                }[currency] ?? 0;
              const priceStr = formatAmount(priceNum, currency);

              // take the first image, or fallback to a gray box
              const imgSrc = p.images[0] ?? "";

              return (
                <div
                  key={item.id}
                  className="relative border rounded-lg overflow-hidden"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => remove(item.id)}
                    className="absolute top-2 right-2 z-10 rounded-full bg-white p-1 shadow hover:bg-red-50"
                    aria-label="Remove from wishlist"
                  >
                    <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                  </button>

                  <Link href={`/product/${p.id}`} className="block">
                    {/* Image */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={p.name}
                          className="max-h-full"
                        />
                      ) : (
                        <div className="text-gray-400">No image</div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="p-4 space-y-1">
                      <h3 className="text-sm font-medium">{p.name}</h3>
                      <p className="text-xs text-gray-500">
                        {p.category}
                      </p>
                      <p className="mt-2 font-semibold">{priceStr}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-12">
            <p className="text-muted-foreground">
              Your wishlist is empty.
            </p>
            <Link href="/all-products">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
