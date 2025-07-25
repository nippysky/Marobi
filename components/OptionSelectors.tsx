"use client";

import React from "react";

interface OptionSelectorsProps {
  sizes: string[];
  colors: string[];
  maxQuantity: number;

  // Controlled props from parent
  selectedSize: string;
  onSizeChange: (value: string) => void;

  selectedColor: string;
  onColorChange: (value: string) => void;

  selectedQuantity: number;
  onQuantityChange: (q: number) => void;
}

const OptionSelectors: React.FC<OptionSelectorsProps> = ({
  sizes,
  colors,
  maxQuantity,

  selectedSize,
  onSizeChange,

  selectedColor,
  onColorChange,

  selectedQuantity,
  onQuantityChange,
}) => {
  const decrement = () => {
    const newQ = Math.max(1, selectedQuantity - 1);
    onQuantityChange(newQ);
  };

  const increment = () => {
    const newQ = Math.min(maxQuantity, selectedQuantity + 1);
    onQuantityChange(newQ);
  };

  return (
    <section className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0 my-5">
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
          onChange={(e) => onColorChange(e.target.value)}
          className="
            w-full rounded-md border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            py-2 px-3
            text-sm text-gray-700 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-brand
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
          onChange={(e) => onSizeChange(e.target.value)}
          className="
            w-full rounded-md border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            py-2 px-3
            text-sm text-gray-700 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-brand
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
            value={selectedQuantity}
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
        <p className="text-xs text-gray-500">(Max: {maxQuantity})</p>
      </div>
    </section>
  );
};

export default OptionSelectors;
