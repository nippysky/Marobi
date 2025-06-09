"use client";

import React, { useState, useCallback } from "react";
import FilterSidebar, { Filters } from "./FilterSidebar";
import ProductGrid from "./ProductGrid";
import { Product } from "@/lib/products";
import { useCurrency } from "@/lib/context/currencyContext";

interface Props {
  initialProducts: Product[];
}

export default function FilterableProductList({ initialProducts }: Props) {
  const [filtered, setFiltered] = useState<Product[]>(initialProducts);
  const { currency } = useCurrency();

  const handleFilterChange = useCallback(
    (f: Filters) => {
      setFiltered(
        initialProducts.filter((p) => {
          const pr = p.prices[currency];
          if (pr < f.priceRange[0] || pr > f.priceRange[1]) return false;
          if (f.onSale && !p.isDiscounted) return false;
          if (f.inStock) {
            const totalStock = p.variants.reduce(
              (sum, v) => sum + v.sizes.reduce((ss, s) => ss + s.inStock, 0),
              0
            );
            if (totalStock === 0) return false;
          }
          if (
            f.colors.length &&
            !p.variants.some((v) => f.colors.includes(v.color))
          )
            return false;
          if (
            f.sizes.length &&
            !p.variants.some((v) =>
              v.sizes.some((s) => f.sizes.includes(s.size) && s.inStock > 0)
            )
          )
            return false;
          return true;
        })
      );
    },
    [initialProducts, currency]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
      <FilterSidebar products={initialProducts} onChange={handleFilterChange} />
      <ProductGrid products={filtered} />
    </div>
  );
}
