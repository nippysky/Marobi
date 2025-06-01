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
import { CartSheet } from "./cart-sheet";
import { SearchModal } from "../SearchModal";
import { SizeChartModal } from "../SizeChartModal";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { useSizeChart } from "@/lib/context/sizeChartcontext";

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
      transition: { duration: 0.3 },
      display: "block",
    },
    collapsed: {
      height: 0,
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
      transitionEnd: { display: "none" },
    },
  };

  return (
    <>
      <motion.header
        className="sticky top-0 inset-x-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black"
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
                          text-sm tracking-wide
                          text-gray-700 dark:text-gray-300
                          hover:underline 
                          ${isActive ? "underline font-semibold" : ""}
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

                {/* Size Chart Icon now opens SizeChartModal */}
                <button
                  onClick={openSizeChart}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                  aria-label="Open size chart"
                >
                  <PencilRuler className="w-5 h-5" />
                </button>

                <Link
                  href="/account"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  <UserRound className="w-5 h-5" />
                </Link>

                <Link
                  href="/wishlist"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  <Heart className="w-5 h-5" />
                </Link>

                <CartSheet />
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
                    <Input
                      placeholder="…Search for products"
                      onFocus={() => setIsSearchOpen(true)}
                      className="
                        w-full rounded-full text-center
                        placeholder-gray-500 dark:placeholder-gray-400
                        bg-gray-100 dark:bg-gray-800
                        focus:ring-0 focus:ring-offset-0 border-transparent
                        text-sm py-2 cursor-pointer
                      "
                      readOnly
                    />
                  </motion.div>
                </div>

                {/* Column 3: Icons */}
                <div className="flex items-center justify-end space-x-6">
                  <CurrencySelector />

                  {/* Size Chart Icon */}
                  <button
                    onClick={openSizeChart}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                    aria-label="Open size chart"
                  >
                    <PencilRuler className="w-5 h-5" />
                  </button>

                  <Link
                    href="/account"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    <UserRound className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/wishlist"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    <Heart className="w-5 h-5" />
                  </Link>

                  <CartSheet />
                </div>
              </div>

              {/* ROW 2: Centered Nav Links */}
              <motion.nav
                aria-label="Main navigation"
                className="mt-1 overflow-hidden"
                variants={topNavVariants}
                initial="expanded"
                animate={isCollapsed ? "collapsed" : "expanded"}
              >
                <ul className="flex justify-center space-x-10 py-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href} className="list-none">
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
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                aria-label="Open search"
              >
                <SearchIcon className="w-5 h-5" />
              </button>

              {/* CartSheet trigger */}
              <CartSheet />

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
