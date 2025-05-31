// app/categories/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { getProductsByCategory, Product } from "@/lib/products";
import { CATEGORIES, getCategoryBySlug } from "@/lib/constants/categories";
import Header from "@/components/shared/header";
import ProductCard from "@/components/shared/product-card";

interface CategoryPageProps {
  params: { slug: string };
}

/**
 * Next.js will pre-render one page per category slug at build time.
 */
export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Await params before destructuring
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  // If slug doesn’t match any category, show 404
  if (!category) {
    notFound();
  }

  // Fetch products for this category
  const products: Product[] = getProductsByCategory(slug);

  return (
    <section className="flex flex-col lg:px-20 md:px-10 px-5">
      <Header />

      <main className="mt-10">
        {/* ───── Breadcrumb ───── */}
        <nav
          className="text-sm text-gray-600 dark:text-gray-400 mb-6"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center space-x-1">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <Link href="/categories" className="hover:underline">
                Categories
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="font-semibold text-gray-900 dark:text-gray-100">
              {category.name}
            </li>
          </ol>
        </nav>

        {/* ───── Page Title & Description ───── */}
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {category.description}
          </p>
        )}

        {/* ───── Products Grid ───── */}
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-10 lg:pb-0">
          {products.map((prod) => (
            <Link key={prod.id} href={`/product/${prod.id}`} className="block">
              <ProductCard product={prod} />
            </Link>
          ))}
        </div>
      </main>
    </section>
  );
}
