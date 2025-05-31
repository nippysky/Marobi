// components/CurrencySelector.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const currencies = ["NGN", "USD", "EUR", "GBP"];

export const CurrencySelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("NGN");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex items-center
          text-sm font-medium
          text-gray-700 dark:text-gray-300
          hover:text-gray-900 dark:hover:text-gray-100
          focus:outline-none
        "
      >
        <span>{selected}</span>
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="
            absolute right-0 mt-2 w-24
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-md shadow-lg
            z-50
          "
        >
          <ul className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
            {currencies.map((cur) => (
              <li key={cur}>
                <button
                  onClick={() => {
                    setSelected(cur);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  {cur}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
