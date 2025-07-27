import React from "react";
import { notFound } from "next/navigation";
import { getProductsByCategory, Product } from "@/lib/products";
import { prisma } from "@/lib/db";
import Header from "@/components/shared/header";
import Banner from "@/components/categories/Banner";
import FilterableProductList from "@/components/categories/FilterableProductList";
import Footer from "@/components/shared/footer";

// For static generation of category paths (if using SSG)
export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });
  return categories.map((cat) => ({ slug: cat.slug }));
}

// Individual Category Page
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the category from DB
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!category) notFound();

  // Fetch products in this category (from your efficient lib/products function)
  const products: Product[] = await getProductsByCategory(slug);

  return (
    <section className="flex flex-col">
      <Header />
      <Banner name={category.name} />

      <main className="container mx-auto px-5 mt-10 pb-20">
        <FilterableProductList initialProducts={products} />
      </main>

      <Footer />
    </section>
  );
}
