// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Heart,
  ShoppingBag,
  ChevronDown,
  PencilRuler,
  UserRound,
} from "lucide-react";

const navItems: { label: string; href: string }[] = [
  { label: "All Products", href: "/all-products" },
  { label: "Corporate Wears", href: "/corporate-wears" },
  { label: "African Print", href: "/african-print" },
  { label: "Casual Looks", href: "/casual-looks" },
  { label: "I Have an Event", href: "/i-have-an-event" },
];

export const Header: React.FC = () => {
  const pathname = usePathname() || "/";

  return (
    <header
      className="
        sticky top-0 z-50 w-full pb-2
        bg-white/50 dark:bg-black/50 backdrop-blur-sm
        border-b border-gray-200 dark:border-gray-700
      "
    >
      {/* ───────────────────────────────────────────────────────
          “Container” wrapper: everything in here is max-width + centered.
      ─────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[1920px] mx-auto">
        {/* ────────────────────────────────────────────────────
            Top row: three-column grid (logo | search | icons)
        ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 items-center h-16">
          {/* — Column 1: Logo on far left */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            >
              MAROB!
            </Link>
          </div>

          {/* — Column 2: Search BOX, perfectly centered */}
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <Input
                placeholder="…Search for products"
                className="
                  w-full
                  rounded-full
                  text-center
                  placeholder-gray-500 dark:placeholder-gray-400
                  bg-gray-100 dark:bg-gray-800
                  focus:ring-0 focus:ring-offset-0
                  border-transparent
                  text-sm
                  py-2
                "
              />
            </div>
          </div>

          {/* — Column 3: Icons on far right */}
          <div className="flex items-center justify-end space-x-6">
            {/* Currency selector */}
            <button
              type="button"
              className="
                flex items-center
                text-sm font-medium
                text-gray-700 dark:text-gray-300
                hover:text-gray-900 dark:hover:text-gray-100
                focus:outline-none
              "
            >
              <span>NGN</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {/* Size Chart icon */}
            <Link
              href="/size-chart"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              <PencilRuler className="w-5 h-5" />
            </Link>

            {/* User/Account icon */}
            <Link
              href="/account"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              <UserRound className="w-5 h-5" />
            </Link>

            {/* Wishlist/heart icon */}
            <Link
              href="/wishlist"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Shopping bag/cart icon */}
            <Link
              href="/cart"
              className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              <ShoppingBag className="w-5 h-5" />
              <span
                className="
                  absolute -top-1 -right-1 
                  inline-flex items-center justify-center 
                  px-1.5 py-0.5 text-xs font-bold leading-none 
                  text-white bg-green-500 rounded-full
                "
              >
                0
              </span>
            </Link>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────
            Bottom row: Navigation links (also centered in same container)
        ──────────────────────────────────────────────────── */}
        <nav aria-label="Main navigation" className="mt-1">
          <ul className="flex justify-center space-x-10 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      text-sm tracking-wide
                      text-black dark:text-white
                      hover:underline 
                      ${isActive ? "underline font-semibold" : ""}
                    `}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
};
