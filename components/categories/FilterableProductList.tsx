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

          // "On sale" logic: you may want to remove this, or define a "sale" field on Product in the DB
          // if (f.onSale && !p.isDiscounted) return false;

          // In stock: product must have at least one variant with inStock > 0
          if (f.inStock && !p.variants.some((v) => v.inStock > 0)) return false;

          // Color filter: at least one variant with the selected color
          if (f.colors.length && !p.variants.some((v) => f.colors.includes(v.color)))
            return false;

          // Size filter: at least one variant with the selected size and inStock > 0
          if (
            f.sizes.length &&
            !p.variants.some((v) => f.sizes.includes(v.size) && v.inStock > 0)
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
