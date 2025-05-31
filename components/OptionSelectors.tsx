// components/OptionSelectors.tsx
"use client";

import React, { useState } from "react";

interface OptionSelectorsProps {
  sizes: string[];
  colors: string[];
  maxQuantity: number;
  onQuantityChange?: (q: number) => void;
}

const OptionSelectors: React.FC<OptionSelectorsProps> = ({
  sizes,
  colors,
  maxQuantity,
  onQuantityChange,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const decrement = () => {
    setQuantity((q) => {
      const newQ = Math.max(1, q - 1);
      onQuantityChange?.(newQ);
      return newQ;
    });
  };

  const increment = () => {
    setQuantity((q) => {
      const newQ = Math.min(maxQuantity, q + 1);
      onQuantityChange?.(newQ);
      return newQ;
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0 my-5 relative">
      {/* Size dropdown */}
      <div className="flex-1 flex flex-col">
        <label
          htmlFor="size"
          className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Size
        </label>
        <select
          id="size"
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="
            w-full rounded-md border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            py-2 px-3
            text-sm text-gray-700 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-green-500
          "
        >
          <option value="">Select Size</option>
          {sizes.map((sz) => (
            <option key={sz} value={sz}>
              {sz}
            </option>
          ))}
        </select>
      </div>

      {/* Color dropdown */}
      <div className="flex-1 flex flex-col">
        <label
          htmlFor="color"
          className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Color
        </label>
        <select
          id="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="
            w-full rounded-md border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            py-2 px-3
            text-sm text-gray-700 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-green-500
          "
        >
          <option value="">Choose Color</option>
          {colors.map((cl) => (
            <option key={cl} value={cl}>
              {cl}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity selector */}
      <div className="flex-1 flex flex-col">
        <label
          htmlFor="quantity"
          className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Quantity
        </label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={decrement}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-l-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            –
          </button>
          <input
            id="quantity"
            type="text"
            readOnly
            value={quantity}
            className="
              w-12 text-center
              border-t border-b border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800
              text-sm text-gray-700 dark:text-gray-200
            "
          />
          <button
            type="button"
            onClick={increment}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionSelectors;
