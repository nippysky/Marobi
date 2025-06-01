// pages/wishlist.tsx
import React from "react";
import Link from "next/link";

import Header from "@/components/shared/header";
import WishlistList from "@/components/WishList";


export default function WishlistPage() {
  return (
    <section className="flex flex-col lg:px-20 md:px-10 px-5">
      {/* Site Header */}
      <Header />

      <div className="mt-10 pb-20">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / <span className="font-medium">Wishlist</span>
        </nav>

        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

        {/* Wishlist contents (client side) */}
        <WishlistList />
      </div>
    </section>
  );
}
