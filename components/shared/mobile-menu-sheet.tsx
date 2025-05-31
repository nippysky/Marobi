// components/MobileMenuSheet.tsx
"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu as MenuIcon } from "lucide-react";
import Link from "next/link";

const navItems: { label: string; href: string }[] = [
  { label: "All Products", href: "/all-products" },
  { label: "Corporate Wears", href: "/corporate-wears" },
  { label: "African Print", href: "/african-print" },
  { label: "Casual Looks", href: "/casual-looks" },
  { label: "I Have an Event", href: "/i-have-an-event" },
];

export const MobileMenuSheet: React.FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
          <MenuIcon className="w-6 h-6" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[80vw] sm:w-[60vw]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 px-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-lg font-medium text-gray-800 dark:text-gray-200 hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
