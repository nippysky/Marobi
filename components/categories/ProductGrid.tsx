import Link from "next/link";
import React from "react";
import { Product } from "@/lib/products";
import ProductCard from "@/components/shared/product-card";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((prod) => (
        <Link key={prod.id} href={`/product/${prod.id}`} className="block">
          <ProductCard product={prod} />
        </Link>
      ))}
    </section>
  );
}
