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
import { AlignJustify, PencilRuler, UserRound, LogOut } from "lucide-react";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useSession, signOut } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/categories";

export const MobileMenuSheet: React.FC = () => {
  const pathname = usePathname() || "/";
  const { openSizeChart } = useSizeChart();
  const { data: session, status } = useSession();

  // Fetch categories from our new API
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: () =>
      fetch("/api/categories")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load categories");
          return res.json();
        })
        .then((data) => data as Category[]),
    staleTime: 300_000, // 5 minutes
  });

  // Build nav items dynamically
  const navItems: { label: string; href: string }[] = [
    { label: "All Products", href: "/all-products" },
    ...categories.map((cat) => ({
      label: cat.name,
      href: `/categories/${cat.slug}`,
    })),
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <AlignJustify className="w-5 h-5 cursor-pointer text-gray-600 dark:text-gray-300" />
      </SheetTrigger>

      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {/* ─── Primary navigation ─── */}
        <nav className="mt-8 px-4 space-y-6">
          {categoriesLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            navItems.map(({ label, href }) => {
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
            })
          )}
        </nav>

        <div className="my-8 border-t border-gray-200 dark:border-gray-700" />

        {/* ─── Account & utilities ─── */}
        <div className="px-4 space-y-6">
          {status === "loading" ? (
            <Skeleton className="h-8 w-32" />
          ) : !session ? (
            <Link
              href="/auth/login"
              className="flex w-full items-center space-x-2 text-gray-700 dark:text-gray-300 hover:underline"
            >
              <UserRound className="w-5 h-5" />
              <span>Login</span>
            </Link>
          ) : (
            <>
              <Link
                href="/account"
                className="flex w-full items-center space-x-2 text-gray-700 dark:text-gray-300 hover:underline"
              >
                <UserRound className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center space-x-2 text-gray-700 dark:text-gray-300 hover:underline"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </>
          )}

          {/* Size Chart */}
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
