"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Search as SearchIcon, PencilRuler, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/constants/categories";
import { CurrencySelector } from "./currency-selector";
import { SizeChartModal } from "../SizeChartModal";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { CartSheet } from "./cart-sheet";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useSearchModal } from "@/lib/context/searchModalContext";
import { SearchModal } from "../SearchModal";
import { getCurrentUser, User as AppUser } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";
import MobileMenuSheet from "./mobile-menu-sheet";
import SearchBar from "../SearchBar";

const BrandIcon: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold">
    M!
  </div>
);

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
  const { isOpen, openModal, closeModal } = useSearchModal();
  const [mounted, setMounted] = useState(false);

  const [user, setUser] = useState<AppUser | null | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then((u) => setUser(u));
  }, []);

  useEffect(() => {
    const onScroll = () => setIsCollapsed(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const accountTooltip = (() => {
    if (user === undefined) return null;
    return user ? `Hello, ${user.name}` : "Login to your account";
  })();

  const linkBaseClasses =
    "tracking-widest font-semibold uppercase py-1 px-3 rounded-full transition duration-300 ease-in-out";

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
          {/* Desktop */}
          <div className="hidden lg:block">
            {/* Collapsed Header */}
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
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${linkBaseClasses} text-[0.85rem] text-gray-700 hover:bg-brand hover:text-white ${
                          isActive ? "bg-brand text-white" : ""
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
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
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
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
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                    >
                      <PencilRuler className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Size Chart</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <Link
                    href="/account"
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    <TooltipTrigger asChild>
                      <UserRound className="w-5 h-5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {accountTooltip ?? <Skeleton className="h-4 w-20" />}
                    </TooltipContent>
                  </Link>
                </Tooltip>

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

            {/* Expanded Header */}
            <motion.div className={`${isCollapsed ? "hidden" : "block"}`}>
              <div className="grid grid-cols-3 items-center h-16">
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
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                      >
                        <PencilRuler className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Size Chart</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <Link
                      href="/account"
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      <TooltipTrigger asChild>
                        <UserRound className="w-5 h-5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {accountTooltip ?? <Skeleton className="h-4 w-20" />}
                      </TooltipContent>
                    </Link>
                  </Tooltip>

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
                <ul className="flex justify-center space-x-28 py-5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href} className="list-none">
                        <Link
                          href={item.href}
                          className={`${linkBaseClasses} text-[0.85rem] text-gray-700 hover:bg-brand hover:text-white ${
                            isActive ? "bg-brand text-white" : ""
                          }`}
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
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
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
