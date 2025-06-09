"use client";

import React, { useState, useCallback } from "react";
import FilterSidebar, { Filters } from "./FilterSidebar";
import ProductGrid from "./ProductGrid";
import { Product } from "@/lib/products";

interface Props {
  initialProducts: Product[];
}

export default function FilterableProductList({ initialProducts }: Props) {
  const [filtered, setFiltered] = useState<Product[]>(initialProducts);

  // memoize so sidebar’s onChange prop is stable
  const handleFilterChange = useCallback(
    (f: Filters) => {
      setFiltered(
        initialProducts.filter((p) => {
          // price
          const pr = p.prices.NGN;
          if (pr < f.priceRange[0] || pr > f.priceRange[1]) return false;
          // onSale
          if (f.onSale && !p.isDiscounted) return false;
          // inStock
          if (f.inStock) {
            const total = p.variants.reduce(
              (sum, v) => sum + v.sizes.reduce((ss, s) => ss + s.inStock, 0),
              0
            );
            if (total === 0) return false;
          }
          // colors
          if (f.colors.length) {
            if (!p.variants.some((v) => f.colors.includes(v.color)))
              return false;
          }
          // sizes
          if (f.sizes.length) {
            if (
              !p.variants.some((v) =>
                v.sizes.some((s) => f.sizes.includes(s.size) && s.inStock > 0)
              )
            )
              return false;
          }
          return true;
        })
      );
    },
    [initialProducts]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
      <FilterSidebar products={initialProducts} onChange={handleFilterChange} />
      <ProductGrid products={filtered} />
    </div>
  );
}
