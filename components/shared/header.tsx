"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Search as SearchIcon,
  PencilRuler,
  UserRound,
  User as UserIcon,
  LogOut as LogoutIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { SizeChartModal } from "../SizeChartModal";
import { useSizeChart } from "@/lib/context/sizeChartcontext";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useSearchModal } from "@/lib/context/searchModalContext";
import { SearchModal } from "../SearchModal";
import { Skeleton } from "@/components/ui/skeleton";
import MobileMenuSheet from "./mobile-menu-sheet";
import SearchBar from "../SearchBar";

import type { Category } from "@/lib/categories";
import { CurrencySelector } from "./currency-selector";
import { CartSheet } from "./cart-sheet";

import { useCategories } from "@/lib/hooks/useCategories";
import { FuturisticSkeleton } from "../FuturisticSkeleton";


const BrandIcon: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold bg-gradient-to-tr from-brand to-green-600 text-white shadow-md">
    M!
  </div>
);

export const Header: React.FC = () => {
  const pathname = usePathname() || "/";
  const { openSizeChart } = useSizeChart();
  const { isOpen, openModal } = useSearchModal();
  const { data: session, status } = useSession();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError,
    error,
  } = useCategories();

  // build nav items (memoized)
  const navItems = useMemo<
    { label: string; href: string }[]
  >(
    () => [
      { label: "All Products", href: "/all-products" },
      ...categories.map((cat: Category) => ({
        label: cat.name,
        href: `/categories/${cat.slug}`,
      })),
    ],
    [categories]
  );

  // user menu outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // collapse header on scroll
  useEffect(() => {
    const onScroll = () => setIsCollapsed(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // motion variants
  const headerVariants = {
    expanded: { height: "auto", backgroundColor: "#ffffff" },
    collapsed: { height: "4rem", backgroundColor: "#ffffff" },
  };
  const logoTextVariants = {
    expanded: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    collapsed: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };
  const logoIconVariants = {
    expanded: { opacity: 0, x: 20, transition: { duration: 0.2 } },
    collapsed: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  };
  const searchInputVariants = {
    expanded: { opacity: 1, width: "40vw", transition: { duration: 0.3 } },
    collapsed: { opacity: 0, width: 0, transition: { duration: 0.2 } },
  };
  const searchIconVariants = {
    expanded: { opacity: 0, x: 10 },
    collapsed: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };
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

  const linkBaseClasses =
    "tracking-widest font-semibold uppercase py-1 px-3 rounded-full transition duration-300 ease-in-out";

  // user menu UI
  const UserMenu = () => {
    if (status === "loading") {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    if (!session) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/auth/login"
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <UserRound className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Login to your account</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="User menu"
        >
          <UserRound className="w-5 h-5" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50"
            >
              <Link
                href="/account"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <LogoutIcon className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderNavItems = (isCompact: boolean = false) => {
    if (categoriesLoading) {
      return <FuturisticSkeleton count={isCompact ? 3 : 5} height={28} />;
    }
    if (isError) {
      return (
        <div className="flex items-center space-x-2 text-sm text-red-500">
          <span>Failed to load categories</span>
        </div>
      );
    }
    return (
      <ul className="flex flex-wrap justify-center gap-x-12 gap-y-2">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <motion.li
              key={item.href}
              className="list-none"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 6 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.25, delay: 0.04 * i },
                },
              }}
            >
              <Link
                href={item.href}
                className={`${linkBaseClasses} text-[0.85rem] text-gray-700 hover:bg-brand hover:text-white ${
                  isActive ? "bg-brand text-white" : ""
                }`}
              >
                {item.label}
              </Link>
            </motion.li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <motion.header
        className="sticky top-0 inset-x-0 z-50 border-b border-gray-200 bg-white lg:px-20 md:px-10 px-5"
        variants={headerVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        initial="expanded"
        transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
      >
        <div className="w-full max-w-[1920px] mx-auto">
          {/* Desktop */}
          <div className="hidden lg:block">
            {/* Collapsed */}
            <motion.div
              className={`${
                isCollapsed ? "flex" : "hidden"
              } items-center justify-between h-16`}
              initial={false}
              animate={isCollapsed ? "collapsed" : "expanded"}
            >
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
                <div className="flex items-center space-x-3">
                  {categoriesLoading ? (
                    <FuturisticSkeleton count={3} height={24} />
                  ) : (
                    navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${linkBaseClasses} text-[0.75rem] text-gray-700 hover:bg-brand hover:text-white ${
                            isActive ? "bg-brand text-white" : ""
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <CurrencySelector />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={searchIconVariants}
                      initial="expanded"
                      animate={isCollapsed ? "collapsed" : "expanded"}
                    >
                      <button
                        type="button"
                        onClick={openModal}
                        className="text-gray-600 hover:text-gray-800 p-2"
                        aria-label="Search products"
                      >
                        <SearchIcon className="w-5 h-5" />
                      </button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search Products</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={openSizeChart}
                      className="text-gray-600 hover:text-gray-800 p-2"
                    >
                      <PencilRuler className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Size Chart</p>
                  </TooltipContent>
                </Tooltip>

                <UserMenu />

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

            {/* Expanded */}
            <motion.div className={`${isCollapsed ? "hidden" : "block"}`}>
              <div className="grid grid-cols-3 items-center h-16">
                <motion.div
                  variants={logoTextVariants}
                  initial="expanded"
                  animate={isCollapsed ? "collapsed" : "expanded"}
                  className="flex items-center"
                >
                  <Link href="/" className="text-2xl font-bold text-gray-900">
                    MAROB!
                  </Link>
                </motion.div>

                <div className="flex justify-center">
                  <motion.div
                    className="w-full max-w-lg"
                    variants={searchInputVariants}
                    initial="expanded"
                    animate={isCollapsed ? "collapsed" : "expanded"}
                  >
                    <SearchBar />
                  </motion.div>
                </div>

                <div className="flex items-center justify-end space-x-6">
                  <CurrencySelector />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={openSizeChart}
                        className="text-gray-600 hover:text-gray-800 p-2"
                      >
                        <PencilRuler className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Size Chart</p>
                    </TooltipContent>
                  </Tooltip>

                  <UserMenu />

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

              <motion.nav
                aria-label="Main navigation"
                className="mt-5 overflow-hidden"
                variants={topNavVariants}
                initial="expanded"
                animate={isCollapsed ? "collapsed" : "expanded"}
              >
                <div className="py-5 flex justify-center">
                  {renderNavItems(false)}
                </div>
              </motion.nav>
            </motion.div>
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center justify-between h-16">
            <Link href="/">
              <BrandIcon />
            </Link>
            <div className="flex items-center space-x-2">
              <CurrencySelector />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={openModal}
                    className="text-gray-600 hover:text-gray-800 p-2"
                    aria-label="Search products"
                  >
                    <SearchIcon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search Products</p>
                </TooltipContent>
              </Tooltip>
              <CartSheet />
              <MobileMenuSheet />
            </div>
          </div>
        </div>
      </motion.header>

      {isOpen && <SearchModal />}
      <SizeChartModal />
    </>
  );
};

export default Header;
