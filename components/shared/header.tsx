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
import { SizeChartModal } from "../SizeChartModal";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { useSizeChart } from "@/lib/context/sizeChartcontext";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { CartSheet } from "./cart-sheet";
import { useAccountModal } from "@/lib/context/accountModalContext";
import { AccountModal } from "../AccountModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { WishlistSheet } from "./wishlist-sheet";
import { useSearchModal } from "@/lib/context/searchModalContext";
import { SearchModal } from "../SearchModal";

const BrandIcon: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold">M!</div>
);

const navItems: { label: string; href: string }[] = [
  { label: "All Products", href: "/all-products" },
  ...CATEGORIES.map((cat) => ({
    label: cat.name,
    href: `/categories/${cat.slug}`,
  })),
];

type User = { name: string };

export const Header: React.FC = () => {
  const pathname = usePathname() || "/";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const { openSizeChart } = useSizeChart();
  const { openModal: openAccountModal } = useAccountModal();
  const { isOpen, openModal, closeModal } = useSearchModal();
  const [mounted, setMounted] = useState(false);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => setMounted(true), []);
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

  const user = null as User | null;
  const accountTooltip = user?.name ? `Hello, ${user.name}` : "Login to your account";

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
          <div className="hidden lg:block">
            <motion.div
              className={`${isCollapsed ? "flex" : "hidden"} items-center justify-between h-16`}
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

                <div className="flex items-center space-x-6">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`text-[0.85rem] tracking-widest font-semibold uppercase text-gray-700 dark:text-gray-300 hover:underline transition-all duration-300 ease-in-out ${isActive ? "underline font-extrabold" : ""}`}
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
                  <TooltipTrigger asChild>
                    <button
                      onClick={openAccountModal}
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                    >
                      <UserRound className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{accountTooltip}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div onClick={() => setIsWishlistOpen(true)}>
                      <Heart className="w-5 h-5 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Wishlist</p>
                  </TooltipContent>
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

            <motion.div className={`${isCollapsed ? "hidden" : "block"}`}>
              <div className="grid grid-cols-3 items-center h-16">
                <motion.div
                  variants={logoTextVariants}
                  initial="expanded"
                  animate={isCollapsed ? "collapsed" : "expanded"}
                  className="flex items-center"
                >
                  <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    MAROB!
                  </Link>
                </motion.div>
                <div className="flex justify-center">
                  <motion.div
                    className="relative w-full max-w-lg"
                    variants={searchInputVariants}
                    initial="expanded"
                    animate={isCollapsed ? "collapsed" : "expanded"}
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <SearchIcon className="mr-2 text-gray-500 dark:text-gray-400" size={16} />
                      <span className="text-sm text-gray-500 dark:text-gray-400 select-none">
                        …Search for products
                      </span>
                    </div>
                    <Input
                      placeholder=""
                      onFocus={openModal}
                      readOnly
                      className="w-full rounded-full bg-gray-100 dark:bg-gray-800 focus:ring-0 focus:ring-offset-0 py-2 pl-4 pr-4 border border-gray-300 text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                    />
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
                    <TooltipTrigger asChild>
                      <button
                        onClick={openAccountModal}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                      >
                        <UserRound className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{accountTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={() => setIsWishlistOpen(true)}>
                        <Heart className="w-5 h-5 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Wishlist</p>
                    </TooltipContent>
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
                          className={`text-[0.85rem] tracking-widest font-semibold uppercase text-gray-700 dark:text-gray-300 hover:underline transition-all duration-300 ease-in-out ${isActive ? "underline font-extrabold" : ""}`}
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
              <MobileMenuSheet />
            </div>
          </div>
        </div>
      </motion.header>

      {isOpen && <SearchModal/>}
      <SizeChartModal />
      <AccountModal />
      <WishlistSheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen} />
    </>
  );
};

export default Header;
