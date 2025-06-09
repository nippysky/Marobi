"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Product } from "@/lib/products";
import { Currency, useCurrency } from "@/lib/context/currencyContext";
import useMediaQuery from "@/lib/useMediaQuery";

export interface Filters {
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  onSale: boolean;
  inStock: boolean;
}

interface SidebarProps {
  products: Product[];
  onChange: (f: Filters) => void;
}

const SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function FilterSidebar({ products, onChange }: SidebarProps) {
  const { currency } = useCurrency();
  const symbol = SYMBOLS[currency];

  // recompute price list on currency change
  const priceValues = useMemo(
    () => products.map((p) => p.prices[currency]),
    [products, currency]
  );
  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);

  const colors = useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((p) => p.variants.map((v) => v.color)))
      ),
    [products]
  );
  const sizes = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((p) =>
            p.variants.flatMap((v) => v.sizes.map((s) => s.size))
          )
        )
      ),
    [products]
  );

  const [priceRange, setPriceRange] = useState<[number, number]>([min, max]);
  const [selColors, setSelColors] = useState<string[]>([]);
  const [selSizes, setSelSizes] = useState<string[]>([]);
  const [onSale, setOnSale] = useState(false);
  const [inStock, setInStock] = useState(false);

  // reset slider when currency or product set changes
  useEffect(() => {
    setPriceRange([min, max]);
  }, [min, max]);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const defaultPanels = isDesktop
    ? ["price", "color", "size", "onSale", "inStock"]
    : [];

  // notify parent when filters change
  useEffect(() => {
    onChange({
      priceRange,
      colors: selColors,
      sizes: selSizes,
      onSale,
      inStock,
    });
  }, [priceRange, selColors, selSizes, onSale, inStock, onChange]);

  return (
    <aside>
      <Accordion
        type="multiple"
        defaultValue={defaultPanels}
        className="space-y-4"
      >
        {/* PRICE */}
        <AccordionItem value="price">
          <AccordionTrigger>Price ({symbol})</AccordionTrigger>
          <AccordionContent>
            <SliderPrimitive.Root
              className="relative flex w-full items-center"
              value={priceRange}
              min={min}
              max={max}
              step={1}
              onValueChange={(val) => setPriceRange(val as [number, number])}
            >
              <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-primary/20">
                <SliderPrimitive.Range className="absolute h-full bg-primary" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full bg-white shadow" />
              <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full bg-white shadow" />
            </SliderPrimitive.Root>
            <p className="mt-2 text-sm text-muted-foreground">
              {symbol}
              {priceRange[0].toLocaleString()} – {symbol}
              {priceRange[1].toLocaleString()}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* COLOR */}
        <AccordionItem value="color">
          <AccordionTrigger>Color</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <label
                  key={c}
                  className="inline-flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selColors.includes(c)}
                    onCheckedChange={(checked: CheckedState) => {
                      const isChecked = checked === true;
                      setSelColors((prev) =>
                        isChecked ? [...prev, c] : prev.filter((x) => x !== c)
                      );
                    }}
                  />
                  <span className="text-sm text-foreground">{c}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SIZE */}
        <AccordionItem value="size">
          <AccordionTrigger>Size</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <label
                  key={s}
                  className="inline-flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selSizes.includes(s)}
                    onCheckedChange={(checked: CheckedState) => {
                      const isChecked = checked === true;
                      setSelSizes((prev) =>
                        isChecked ? [...prev, s] : prev.filter((x) => x !== s)
                      );
                    }}
                  />
                  <span className="text-sm text-foreground">{s}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ON SALE */}
        <AccordionItem value="onSale">
          <AccordionTrigger>On Sale</AccordionTrigger>
          <AccordionContent>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={onSale}
                onCheckedChange={(checked: CheckedState) =>
                  setOnSale(checked === true)
                }
              />
              <span className="text-sm text-foreground">
                Only show discounted
              </span>
            </label>
          </AccordionContent>
        </AccordionItem>

        {/* IN STOCK */}
        <AccordionItem value="inStock">
          <AccordionTrigger>In Stock</AccordionTrigger>
          <AccordionContent>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={inStock}
                onCheckedChange={(checked: CheckedState) =>
                  setInStock(checked === true)
                }
              />
              <span className="text-sm text-foreground">
                Only show in-stock
              </span>
            </label>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
