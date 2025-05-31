// components/CartSheet.tsx
"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShoppingBag } from "lucide-react";

export const CartSheet: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
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
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>Your cart is empty.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
