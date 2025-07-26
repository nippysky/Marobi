"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useSizeChart } from "@/lib/context/sizeChartcontext";

interface Entry {
  id: string;
  sizeLabel: string;
  chestMin: number;
  chestMax: number;
  waistMin: number;
  waistMax: number;
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

export const SizeChartModal: React.FC = () => {
  const { isOpen, closeSizeChart } = useSizeChart();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch("/api/store-settings/size-chart")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data: { id: string; entries: Entry[] }) => {
        setEntries(data.entries);
      })
      .catch(() => {
        setError("Failed to load size chart");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sc-backdrop"
            className="fixed inset-0 bg-black/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeSizeChart}
          />

          {/* Modal Container */}
          <motion.div
            key="sc-container"
            className="fixed bottom-0 inset-x-0 z-50 flex flex-col bg-white rounded-t-2xl shadow-xl max-h-[80vh]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Size Chart</h2>
              <button
                onClick={closeSizeChart}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                aria-label="Close size chart"
              >
                <span>Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
                </div>
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : entries.length === 0 ? (
                <div className="text-center text-gray-500">
                  No size chart data available.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2">Size</th>
                      <th className="px-4 py-2">Chest (in)</th>
                      <th className="px-4 py-2">Waist (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id} className="border-b last:border-none">
                        <td className="px-4 py-2">{e.sizeLabel}</td>
                        <td className="px-4 py-2">
                          {e.chestMin}–{e.chestMax}
                        </td>
                        <td className="px-4 py-2">
                          {e.waistMin}–{e.waistMax}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
