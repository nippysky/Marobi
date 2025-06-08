"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AlignJustify, PencilRuler, UserRound } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { useSizeChart } from "@/lib/context/sizeChartcontext";

const navItems = [
  { label: "All Products", href: "/all-products" },
  ...CATEGORIES.map((cat) => ({
    label: cat.name,
    href: `/categories/${cat.slug}`,
  })),
];

export const MobileMenuSheet: React.FC = () => {
  const pathname = usePathname() || "/";
  const { openSizeChart } = useSizeChart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <AlignJustify className="w-5 h-5 cursor-pointer text-gray-600 dark:text-gray-300" />
      </SheetTrigger>

      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {/* primary nav */}
        <nav className="mt-6 px-4 space-y-4">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`block text-base font-medium text-gray-700 dark:text-gray-300 hover:underline ${
                  isActive ? "underline font-semibold" : ""
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

        {/* utilities */}
        <div className="px-4 space-y-4">
          <Link
            href="/account"
            className="flex w-full items-center space-x-2 text-gray-700 dark:text-gray-300 hover:underline"
          >
            <UserRound className="w-5 h-5" />
            <span>Account</span>
          </Link>

          <button
            onClick={openSizeChart}
            className="flex w-full items-center space-x-2 text-gray-700 dark:text-gray-300 hover:underline"
          >
            <PencilRuler className="w-5 h-5" />
            <span>Size Chart</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenuSheet;
