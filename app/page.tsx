export const dynamic = "force-dynamic";

import React from "react";
import HeroSlider, { Slide } from "@/components/HeroSlider";
import FeatureHighlights from "@/components/FeatureHighlights";
import ProductShowcase from "@/components/ProductShowcase";
import { Header } from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import { prisma } from "@/lib/db";
import { getProductsByCategory, Product } from "@/lib/products";
import { getAllCategories, Category } from "@/lib/categories";

export default async function Home() {
  // ─── Hero slides from the database ───────────────────────────────
  const heroRows = await prisma.heroSlide.findMany({
    orderBy: { order: "asc" },
  });
  const heroSlides: Slide[] = heroRows.map((r) => ({
    id:         r.id,
    imageUrl:   r.imageUrl,
    heading:    r.headline    ?? "",
    subtext:    r.subheadline ?? "",
    buttonText: r.ctaText     ?? undefined,
    buttonHref: r.ctaUrl      ?? undefined,
  }));

  // ─── Fetch your four built‑in categories dynamically ───────────────
  const categories: Category[] = await getAllCategories();

  // ─── For each category, fetch up to 4 of its newest “Published” products ────
  const categoriesWithProducts: {
    name: string;
    viewMoreHref: string;
    products: Product[];
  }[] = await Promise.all(
    categories.map(async ({ slug, name }) => {
      const products = await getProductsByCategory(slug, 5);
      return {
        name,
        viewMoreHref: `/categories/${slug}`,
        products,
      };
    })
  );

  return (
    <section className="min-h-screen flex flex-col">
      <Header />
      <main className="w-full flex-1">
        <HeroSlider slides={heroSlides} />
        <FeatureHighlights />
        <ProductShowcase categories={categoriesWithProducts} />
      </main>
      <Footer />
    </section>
  );
}
