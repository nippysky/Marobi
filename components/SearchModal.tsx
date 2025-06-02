"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchModalProps {
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const containerVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};

export const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 bg-black/50 overflow-hidden"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        key="container"
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-black overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: "tween", duration: 0.3 }}
      >
        {/* Header: Close Button */}
        <div className="flex items-center justify-between px-4 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <SearchIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Search
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 flex justify-center">
          <div className="w-full max-w-md mx-auto">
            <Input
              placeholder="Type to search..."
              className="
                w-full
                rounded-full
                text-center
                placeholder-gray-500 dark:placeholder-gray-400
                bg-gray-100 dark:bg-gray-800
                focus:ring-0 focus:ring-offset-0 border-transparent
                text-sm py-2
              "
            />
          </div>
        </div>

        {/* (Optional) Results / Scrollable Content */}
        <div className="flex-1 px-4 overflow-y-auto">
          {/* Replace this with immediate search results as needed */}
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Start typing above to see results…
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
