export const dynamic = "force-dynamic";

import React from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { getCategoryBySlug } from "@/lib/categories";
import {
  getProductById,
  getProductsByCategory,
  getReviewsByProduct,
  Product,
  Review,
} from "@/lib/products";

import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import ReviewSection from "@/components/ReviewSection";
import ProductCard from "@/components/shared/product-card";
import ProductDetailHero from "@/components/ProductDetailsHero";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { authOptions } from "@/lib/authOptions";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product: Product | null = await getProductById(id);
  if (!product) return notFound();

  const category = await getCategoryBySlug(product.category);
  const categoryName = category?.name ?? product.category;

  const related = (
    await getProductsByCategory(product.category, 8)
  ).filter((p) => p.id !== id);

  const reviews: Review[] = await getReviewsByProduct(id);

  const session: Session | null = await getServerSession(authOptions);
  const user = session?.user ?? null;

  return (
    <section className="flex flex-col min-h-screen">
      <Header />

      <main className="mt-10 px-5 md:px-10 lg:px-20 flex-1 space-y-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-600 mb-4">
          <ol className="flex flex-wrap items-center space-x-1 sm:space-x-2">
            <li>
              <a href="/" className="hover:underline">
                Home
              </a>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <a href="/categories" className="hover:underline">
                Categories
              </a>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <a
                href={`/categories/${product.category}`}
                className="hover:underline"
              >
                {categoryName}
              </a>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="font-semibold text-gray-900">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Hero & Details */}
        <ProductDetailHero
          product={product}
          user={user}
          categoryName={categoryName}
        />

        {/* — Separator — */}
        <hr className="my-8 border-gray-200 dark:border-gray-700" />

        {/* — Reviews Accordion — */}
        <div className="lg:px-60">
          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="reviews">
              <AccordionTrigger className="w-full text-xl font-semibold text-gray-900 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                Customer Reviews ({reviews.length})
              </AccordionTrigger>
              <AccordionContent className="mt-4 px-4">
                <ReviewSection
                  productId={product.id}
                  user={user}
                  reviews={reviews}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Related Products */}
        <section className="pb-20 space-y-4 lg:px-60">
          <h2 className="text-xl font-semibold text-gray-900">
            More {categoryName} Looks
          </h2>
          {related.length > 0 ? (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <a key={p.id} href={`/product/${p.id}`} className="block">
                  <ProductCard product={p} />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-500">
              <svg
                className="w-12 h-12 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-lg">No related products found.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </section>
  );
}
