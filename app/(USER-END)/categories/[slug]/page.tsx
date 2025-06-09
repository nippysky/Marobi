import React from "react";
import { notFound } from "next/navigation";
import { getProductsByCategory, Product } from "@/lib/products";
import { CATEGORIES, getCategoryBySlug } from "@/lib/constants/categories";
import Header from "@/components/shared/header";
import Banner from "@/components/categories/Banner";
import FilterableProductList from "@/components/categories/FilterableProductList";
import Footer from "@/components/shared/footer";

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products: Product[] = getProductsByCategory(slug);

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
