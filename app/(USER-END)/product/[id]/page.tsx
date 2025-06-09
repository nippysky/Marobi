import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import Header from "@/components/shared/header";
import ProductCard from "@/components/shared/product-card";
import { getProductById, getProductsByCategory } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/constants/categories";

import ProductDetailHero from "@/components/ProductDetailsHero";
import { getCurrentUser } from "@/lib/session";
import ReviewSection from "@/components/ReviewSection";
import Footer from "@/components/shared/footer";

export async function generateStaticParams() {
  const allProducts = getProductsByCategory("all-products");
  return allProducts.map((p) => ({ id: p.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  // Lookup category metadata for breadcrumbs and related section:
  const categoryMeta = getCategoryBySlug(product.category);
  const categoryName = categoryMeta ? categoryMeta.name : product.category;

  // Fetch related products (exclude current):
  const relatedProducts = getProductsByCategory(product.category).filter(
    (p) => p.id !== product.id
  );

  // NEW: Fetch the current user (or null if not logged in)
  const user = await getCurrentUser();

  return (
    <section className="flex flex-col">
      <Header />

      <main className="mt-10 space-y-12 lg:px-20 md:px-10 px-5">
        {/* ───── Breadcrumb ───── */}
        <nav
          className="text-sm text-gray-600 dark:text-gray-400 mb-4"
          aria-label="Breadcrumb"
        >
          <ol className="flex flex-wrap items-center space-x-1 space-y-1 sm:space-y-0">
            {/* Home */}
            <li className="flex items-center whitespace-nowrap">
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>

            {/* Separator */}
            <li className="flex items-center whitespace-nowrap">
              <span className="mx-2">/</span>
            </li>

            {/* Categories */}
            <li className="flex items-center whitespace-nowrap">
              <Link href="/categories" className="hover:underline">
                Categories
              </Link>
            </li>

            {/* Separator */}
            <li className="flex items-center whitespace-nowrap">
              <span className="mx-2">/</span>
            </li>

            {/* Category Name */}
            <li className="flex items-center whitespace-nowrap">
              <Link
                href={`/categories/${product.category}`}
                className="hover:underline"
              >
                {categoryName}
              </Link>
            </li>

            {/* Separator */}
            <li className="flex items-center whitespace-nowrap">
              <span className="mx-2">/</span>
            </li>

            {/* Current Product */}
            <li className="flex items-center font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* ───── Hero Section (Left: Featured Image; Right: Thumbnails + Details) ───── */}
        <ProductDetailHero product={product} user={user} />

        {/* ───── Reviews Section ───── */}
        <ReviewSection id={product.id} user={user} />

        {/* ───── More from This Category ───── */}
        <section className="space-y-4 pb-20 lg:px-40">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            More {categoryName} Looks
          </h2>
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.slice(0, 8).map((prod) => (
              <Link
                key={prod.id}
                href={`/product/${prod.id}`}
                className="block"
              >
                <ProductCard product={prod} />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </section>
  );
}
