"use client";

import React, { useState, useCallback, useMemo } from "react";
import FilterSidebar, { Filters } from "./FilterSidebar";
import ProductGrid from "./ProductGrid";
import { Product } from "@/lib/products";
import { useCurrency } from "@/lib/context/currencyContext";

interface Props {
  initialProducts: Product[];
  isLoading?: boolean;
}

const DEFAULT_FILTERS: Filters = {
  priceRange: [0, Infinity],
  inStock: false,
  colors: [],
  sizes: [],
  onSale: false,
};

export default function FilterableProductList({
  initialProducts,
  isLoading = false,
}: Props) {
  const { currency } = useCurrency();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const handleFilterChange = useCallback((f: Filters) => {
    setFilters(f);
  }, []);

  const filtered = useMemo(() => {
    if (isLoading) return [];
    return initialProducts.filter((p) => {
      const pr = (p.prices as any)[currency] as number;
      if (pr < filters.priceRange[0] || pr > filters.priceRange[1]) return false;

      if (filters.onSale) {
        // Placeholder: adapt this if you add a sale/discount flag to Product.
        // e.g., if (!p.isDiscounted) return false;
      }

      if (filters.inStock && !p.variants.some((v) => v.inStock > 0)) return false;

      if (
        filters.colors.length &&
        !p.variants.some((v) => filters.colors.includes(v.color))
      )
        return false;

      if (
        filters.sizes.length &&
        !p.variants.some((v) => filters.sizes.includes(v.size) && v.inStock > 0)
      )
        return false;

      return true;
    });
  }, [initialProducts, currency, filters, isLoading]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
      <FilterSidebar products={initialProducts} onChange={handleFilterChange} />
      <ProductGrid products={filtered} isLoading={isLoading} />
    </div>
  );
}
