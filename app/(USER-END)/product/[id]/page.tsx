import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import Header from "@/components/shared/header";
import ProductCard from "@/components/shared/product-card";
import { getProductById, getProductsByCategory, Product } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/constants/categories";

import ReviewCard from "@/components/ReviewCard";
import ProductDetailHero from "@/components/ProductDetailsHero";

interface ProductPageProps {
  params: { id: string };
}

/**
 * Pre-render one page per product ID at build time.
 */
export async function generateStaticParams() {
  const allProducts = getProductsByCategory("all-products");
  return allProducts.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params; // no "use client" here
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  // Lookup the category name for breadcrumb and “More from Category”
  const categoryMeta = getCategoryBySlug(product.category);
  const categoryName = categoryMeta ? categoryMeta.name : product.category;

  // Fetch related products (exclude current)
  const relatedProducts = getProductsByCategory(product.category).filter(
    (p) => p.id !== product.id
  );

  return (
    <section className="flex flex-col lg:px-20 md:px-10 px-5">
      <Header />

      <main className="mt-10 space-y-12">
        {/* ───── Breadcrumb ───── */}
        <nav
          className="text-sm text-gray-600 dark:text-gray-400"
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
            <li>
              <Link
                href={`/categories/${product.category}`}
                className="hover:underline"
              >
                {categoryName}
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="font-semibold text-gray-900 dark:text-gray-100">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* ───── Hero Section (Left: Featured Image; Right: Thumbnails + Details) ───── */}
        <ProductDetailHero product={product} />

        {/* ───── Reviews Section ───── */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Reviews
          </h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[
              {
                author: "Collins Jr",
                content:
                  "I so much love the fact that the gown is well fitted.",
              },
              {
                author: "Adaobi K",
                content: "This dress made me feel elegant all night!",
              },
              { author: "Sandra O", content: "Quality and fit are top-notch." },
            ].map((rev, idx) => (
              <ReviewCard key={idx} author={rev.author} content={rev.content} />
            ))}
          </div>
        </section>

        {/* ───── More from This Category ───── */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            More {categoryName} Looks
          </h2>
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((prod) => (
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
    </section>
  );
}
