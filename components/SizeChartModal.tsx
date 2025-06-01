"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useSizeChart } from "@/lib/context/sizeChartcontext";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const containerVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};

export const SizeChartModal: React.FC = () => {
  const { isOpen, closeSizeChart } = useSizeChart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
                 style={{ zIndex: 600000000 }}
            key="sc-backdrop"
            className="fixed inset-0 z-50 bg-black/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeSizeChart}
          />

          {/* Modal Container */}
          <motion.div
            style={{ zIndex: 600000000 }}
            key="sc-container"
            className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-black"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-4 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Size Chart
              </h2>
              <button
                onClick={closeSizeChart}
                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Close size chart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Replace the below div with your actual size-chart content */}
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              {/* EXAMPLE: a simple table—swap in your real chart */}
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Size</th>
                    <th className="px-2 py-1">Chest (in)</th>
                    <th className="px-2 py-1">Waist (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: "S", chest: "34-36", waist: "28-30" },
                    { size: "M", chest: "38-40", waist: "32-34" },
                    { size: "L", chest: "42-44", waist: "36-38" },
                    { size: "XL", chest: "46-48", waist: "40-42" },
                  ].map((row) => (
                    <tr
                      key={row.size}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-2 py-2">{row.size}</td>
                      <td className="px-2 py-2">{row.chest}</td>
                      <td className="px-2 py-2">{row.waist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
