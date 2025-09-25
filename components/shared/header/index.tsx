"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon, PencilRuler, UserRound } from "lucide-react";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/lib/categories";
import { useCategories } from "@/lib/hooks/useCategories";
import { useAuthSession } from "@/lib/hooks/useAuthSession";
import { FuturisticSkeleton } from "@/components/FuturisticSkeleton";
import { CurrencySelector } from "../currency-selector";
import { CartSheet } from "../cart-sheet";
import MobileMenuSheet from "../mobile-menu-sheet";
import { SizeChartModal } from "@/components/SizeChartModal";
import SearchMobileSheet from "./search-mobile-sheet";
import SearchDesktopPopover from "./search-desktop-popover";

const BrandIcon: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold bg-gradient-to-tr from-brand to-green-600 text-white shadow-md">
    M!
  </div>
);

const linkBase =
  "tracking-widest font-semibold uppercase py-1 px-3 rounded-full transition duration-300 ease-in-out";

export const Header: React.FC = () => {
  const pathname = usePathname() || "/";
  const { openSizeChart } = useSizeChart();
  const { session, status, isCustomer } = useAuthSession();

  const { data: categories = [], isLoading: categoriesLoading, isError } = useCategories();

  const navItems = useMemo<{ label: string; href: string }[]>(
    () => [
      { label: "All Products", href: "/all-products" },
      ...categories.map((cat: Category) => ({
        label: cat.name,
        href: `/categories/${cat.slug}`,
      })),
    ],
    [categories]
  );

  // Transparent at top; white after scroll
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // color helpers (white on transparent, dark on solid)
  const navTextCls = solid
    ? "text-gray-700 hover:bg-brand hover:text-white"
    : "text-white/90 hover:bg-white/15 hover:text-white";
  const activeCls = solid ? "bg-brand text-white" : "bg-white/20 text-white";
  const iconCls = solid
    ? "text-gray-600 hover:text-gray-800"
    : "text-white hover:text-white/90";
  const tone = solid ? "dark" : "light"; // passed to child components

  // Search states
  const [openDesktopSearch, setOpenDesktopSearch] = useState(false);
  const [openMobileSearch, setOpenMobileSearch] = useState(false);
  const desktopSearchAnchorRef = useRef<HTMLDivElement | null>(null);

  function renderNav() {
    if (categoriesLoading) return <FuturisticSkeleton count={4} height={28} />;
    if (isError)
      return (
        <div className="flex items-center space-x-2 text-sm text-red-500">
          <span>Failed to load categories</span>
        </div>
      );

    return (
      <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="list-none">
              <Link
                href={item.href}
                className={`${linkBase} text-[0.8rem] ${navTextCls} ${active ? activeCls : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  const UserIndicator: React.FC = () => {
    if (status === "loading") return <Skeleton className="h-8 w-8 rounded-full" />;
    if (session && isCustomer) {
      const name = session.user.name || "Account";
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/account"
              className={`flex items-center p-2 rounded ${iconCls}`}
              aria-label="Account"
            >
              <UserRound className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p className="whitespace-nowrap">Account: {name}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/auth/login" className={`p-2 rounded ${iconCls}`} aria-label="Login">
            <UserRound className="w-5 h-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Login to your account</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      <header
        className={[
          // fixed to let hero show behind it while transparent
          "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
          solid
            ? "bg-white/95 backdrop-blur-md border-b border-gray-200"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
      >
        <div className="w-full max-w-[1920px] mx-auto lg:px-20 md:px-10 px-5">
          {/* Desktop */}
          <div className="hidden lg:flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/"><BrandIcon /></Link>
              <nav aria-label="Main navigation" className="hidden xl:block">
                {renderNav()}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* NOW tone-aware */}
              <CurrencySelector tone={tone} />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={openSizeChart}
                    className={`p-2 ${iconCls}`}
                    aria-label="View size chart"
                  >
                    <PencilRuler className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>View Size Chart</p></TooltipContent>
              </Tooltip>

              <UserIndicator />

              <Tooltip>
                <TooltipTrigger asChild>
                  <div><CartSheet tone={tone} /></div>
                </TooltipTrigger>
                <TooltipContent><p>View Cart</p></TooltipContent>
              </Tooltip>

              {/* Desktop search icon & anchored popover */}
              <div ref={desktopSearchAnchorRef} className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setOpenDesktopSearch((v) => !v)}
                      className={`p-2 ${iconCls}`}
                      aria-label="Search products"
                    >
                      <SearchIcon className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>Search Products</p></TooltipContent>
                </Tooltip>

                <SearchDesktopPopover
                  open={openDesktopSearch}
                  onClose={() => setOpenDesktopSearch(false)}
                  anchorRef={desktopSearchAnchorRef}
                />
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center justify-between h-16 gap-2">
            <Link href="/"><BrandIcon /></Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenMobileSearch(true)}
                className={`p-2 ${iconCls}`}
                aria-label="Search products"
              >
                <SearchIcon className="w-5 h-5" />
              </button>
              <CurrencySelector tone={tone} />
              <CartSheet tone={tone} />
              <MobileMenuSheet tone={tone} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full-screen search */}
      <SearchMobileSheet open={openMobileSearch} onClose={() => setOpenMobileSearch(false)} />

      <SizeChartModal />
    </>
  );
};

export default Header;
