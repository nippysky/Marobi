"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Search as SearchIcon,
  PencilRuler,
  UserRound,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/constants/categories";
import { CurrencySelector } from "./currency-selector";
import { SearchModal } from "../SearchModal";
import { SizeChartModal } from "../SizeChartModal";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { CartSheet } from "./cart-sheet";

// shadcn UI tooltip components
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// A simple black circle “M!” icon.
const BrandIcon: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold">
    M!
  </div>
);

// Build navItems so that “All Products” → “/all-products”,
// then each category → `/categories/${slug}`
const navItems: { label: string; href: string }[] = [
  { label: "All Products", href: "/all-products" },
  ...CATEGORIES.map((cat) => ({
    label: cat.name,
    href: `/categories/${cat.slug}`,
  })),
];

export const Header: React.FC = () => {
  const pathname = usePathname() || "/";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { openSizeChart } = useSizeChart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // mounted flag for client-only rendering of badges
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Read wishlist count from store
  const wishlistCount = useWishlistStore((s) => s.items.length);

  // Scroll listener toggles collapsed state
  useEffect(() => {
    const onScroll = () => setIsCollapsed(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Variants for the outer header
  const headerVariants = {
    expanded: {
      height: "auto",
      backgroundColor: "#ffffff",
    },
    collapsed: {
      height: "4rem", // 64px
      backgroundColor: "#ffffff",
    },
  };

  // Logo text ↔ icon
  const logoTextVariants = {
    expanded: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    collapsed: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };
  const logoIconVariants = {
    expanded: { opacity: 0, x: 20, transition: { duration: 0.2 } },
    collapsed: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  };

  // Search input ↔ search icon
  const searchInputVariants = {
    expanded: { opacity: 1, width: "40vw", transition: { duration: 0.3 } },
    collapsed: { opacity: 0, width: 0, transition: { duration: 0.2 } },
  };
  const searchIconVariants = {
    expanded: { opacity: 0, x: 10 },
    collapsed: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  // Top nav row (second row) only when expanded
  const topNavVariants = {
    expanded: {
      height: "auto",
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 },
      display: "block",
    },
    collapsed: {
      height: 0,
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
      transitionEnd: { display: "none" },
    },
  };

  // Placeholder user logic; replace with real auth hook
  const user = null as { name: string } | null;
  const accountTooltip = user ? `Hello, ${user.name}` : "Login to your account";

  return (
    <>
      <motion.header
        className="sticky top-0 inset-x-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black lg:px-20 md:px-10 px-5"
        variants={headerVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        initial="expanded"
        transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
      >
        <div className="w-full max-w-[1920px] mx-auto">
          {/**
           * ───────────────────────────────────────────────────────
           * Desktop Header: visible on lg and up
           * ───────────────────────────────────────────────────────
           */}
          <div className="hidden lg:block">
            {/* ────────────────────────────────────────────────────
                SINGLE ROW when collapsed vs TWO ROWS when expanded
            ──────────────────────────────────────────────────── */}
            <motion.div
              className={`${
                isCollapsed ? "flex" : "hidden"
              } items-center justify-between h-16`}
              initial={false}
              animate={isCollapsed ? "collapsed" : "expanded"}
            >
              {/* Left group: Logo Icon + Nav Links */}
              <div className="flex items-center space-x-8">
                <motion.div
                  variants={logoIconVariants}
                  initial="expanded"
                  animate={isCollapsed ? "collapsed" : "expanded"}
                  className="flex items-center"
                >
                  <Link href="/">
                    <BrandIcon />
                  </Link>
                </motion.div>

                <div className="flex items-center space-x-6">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          text-[0.85rem] tracking-widest font-semibold uppercase
                          text-gray-700 dark:text-gray-300
                          hover:underline transition-all duration-300 ease-in-out
                          ${isActive ? "underline font-extrabold" : ""}
                        `}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Right group: CurrencySelector, Search Icon, Other Icons */}
              <div className="flex items-center space-x-6">
                <CurrencySelector />

                {/* Search Icon opens SearchModal */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={searchIconVariants}
                      initial="expanded"
                      animate={isCollapsed ? "collapsed" : "expanded"}
                    >
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(true)}
                        className="
                          text-gray-600 dark:text-gray-300
                          hover:text-gray-800 dark:hover:text-gray-100
                          p-2
                        "
                      >
                        <SearchIcon className="w-5 h-5" />
                      </button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search Products</p>
                  </TooltipContent>
                </Tooltip>

                {/* Size Chart Icon now opens SizeChartModal */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={openSizeChart}
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                      aria-label="Open size chart"
                    >
                      <PencilRuler className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Size Chart</p>
                  </TooltipContent>
                </Tooltip>

                {/* Account Icon with conditional tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/account"
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                    >
                      <UserRound className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{accountTooltip}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Wishlist Icon with count & tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* Wrap the icon in a fixed-size relative container */}
                    <div className="relative inline-block p-2">
                      <Link
                        href="/wishlist"
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                      >
                        <Heart className="w-5 h-5" />
                      </Link>
                      {mounted && wishlistCount > 0 && (
                        <span
                          className="
                            absolute 
                            top-0 right-0
                            bg-green-500 text-white text-xs font-bold 
                            rounded-full w-4 h-4 flex items-center justify-center 
                            -translate-y-1/2 translate-x-1/2
                          "
                        >
                          {wishlistCount}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Wishlist</p>
                  </TooltipContent>
                </Tooltip>

                {/* CartSheet trigger with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <CartSheet />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Cart</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>

            {/* ────────────────────────────────────────────────────
                TWO ROWS when expanded:
                ROW 1: [ “MAROB!” text ] [ centered search input ] [ icons... ]
                ROW 2: [ Nav Links centered ]
            ──────────────────────────────────────────────────── */}
            <motion.div className={`${isCollapsed ? "hidden" : "block"}`}>
              {/* ROW 1 */}
              <div className="grid grid-cols-3 items-center h-16">
                {/* Column 1: Logo Text */}
                <motion.div
                  variants={logoTextVariants}
                  initial="expanded"
                  animate={isCollapsed ? "collapsed" : "expanded"}
                  className="flex items-center"
                >
                  <Link
                    href="/"
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100"
                  >
                    MAROB!
                  </Link>
                </motion.div>

                {/* Column 2: Centered Search Input */}
                <div className="flex justify-center">
                  <motion.div
                    className="relative w-full max-w-lg"
                    variants={searchInputVariants}
                    initial="expanded"
                    animate={isCollapsed ? "collapsed" : "expanded"}
                  >
                    {/* 1) Center wrapper for icon + placeholder/text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <SearchIcon
                        className="mr-2 text-gray-500 dark:text-gray-400"
                        size={16}
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 select-none">
                        …Search for products
                      </span>
                    </div>

                    {/* 2) Actual Input (readOnly) stretched full width, with enough left & right padding so that user text will never overlap the icon+placeholder */}
                    <Input
                      placeholder="" // we moved the placeholder into our flex block above
                      onFocus={() => setIsSearchOpen(true)}
                      readOnly
                      className="
        w-full 
        rounded-full 
        bg-gray-100 dark:bg-gray-800
        focus:ring-0 focus:ring-offset-0
        py-2 
        pl-4 pr-4    /* padding so that cursor/text doesn’t overlap icon/placeholder */
        border border-gray-300
        text-sm text-gray-900 dark:text-gray-100
        cursor-pointer
      "
                    />
                  </motion.div>
                </div>

                {/* Column 3: Icons */}
                <div className="flex items-center justify-end space-x-6">
                  <CurrencySelector />

                  {/* Size Chart Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={openSizeChart}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                        aria-label="Open size chart"
                      >
                        <PencilRuler className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Size Chart</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Account Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/account"
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                      >
                        <UserRound className="w-5 h-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{accountTooltip}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Wishlist Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Same fixed-size relative container here */}
                      <div className="relative inline-block p-2">
                        <Link
                          href="/wishlist"
                          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                        >
                          <Heart className="w-5 h-5" />
                        </Link>
                        {mounted && wishlistCount > 0 && (
                          <span
                            className="
                              absolute 
                              top-1 right-1
                              bg-green-500 text-white text-xs font-bold 
                              rounded-full w-4 h-4 flex items-center justify-center 
                              -translate-y-1/2 translate-x-1/2
                            "
                          >
                            {wishlistCount}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Wishlist</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* CartSheet trigger */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <CartSheet />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Cart</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* ROW 2: Centered Nav Links */}
              <motion.nav
                aria-label="Main navigation"
                className="mt-5 overflow-hidden"
                variants={topNavVariants}
                initial="expanded"
                animate={isCollapsed ? "collapsed" : "expanded"}
              >
                <ul className="flex justify-center space-x-28 py-5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href} className="list-none">
                        <Link
                          href={item.href}
                          className={`
                     text-[0.85rem] tracking-widest font-semibold uppercase
                          text-gray-700 dark:text-gray-300
                          hover:underline transition-all duration-300 ease-in-out
                          ${isActive ? "underline font-extrabold" : ""}
                          `}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </motion.nav>
            </motion.div>
          </div>

          {/**
           * ───────────────────────────────────────────────────────
           * Mobile/Tablet Header: visible on screens < lg
           * ───────────────────────────────────────────────────────
           */}
          <div className="flex lg:hidden items-center justify-between h-16">
            {/* Brand icon on the left */}
            <Link href="/">
              <BrandIcon />
            </Link>

            {/* Right side: Currency, Cart, Search Icon, Hamburger */}
            <div className="flex items-center space-x-2">
              <CurrencySelector />

              {/* Mobile Search Icon (opens SearchModal) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                    aria-label="Open search"
                  >
                    <SearchIcon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search Products</p>
                </TooltipContent>
              </Tooltip>

              {/* CartSheet trigger */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <CartSheet />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Cart</p>
                </TooltipContent>
              </Tooltip>

              {/* Mobile Menu Sheet (now in a separate file) */}
              <MobileMenuSheet />
            </div>
          </div>
        </div>
      </motion.header>

      {/* SearchModal (desktop + mobile) */}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}

      {/* SizeChartModal (anywhere in the app) */}
      <SizeChartModal />
    </>
  );
};

export default Header;
