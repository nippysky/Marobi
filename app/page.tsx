import HeroSlider from "@/components/HeroSlider";
import ProductShowcase from "@/components/ProductShowcase";
import { Header } from "@/components/shared/header";
import { Metadata } from "next";

// Import your data‐fetching helper
import { getProductsByCategory, Product } from "@/lib/products";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  // 1) Define category “slugs” + display names
  const categoryMeta: { name: string; slug: string; viewMoreHref: string }[] = [
    {
      name: "Corporate Wears",
      slug: "corporate-wears",
      viewMoreHref: "/categories/corporate-wears",
    },
    {
      name: "African Prints",
      slug: "african-print",
      viewMoreHref: "/categories/african-print",
    },
    {
      name: "Casual Looks",
      slug: "casual-looks",
      viewMoreHref: "/categories/casual-looks",
    },
    {
      name: "I Have an Event",
      slug: "i-have-an-event",
      viewMoreHref: "/categories/i-have-an-event",
    },
  ];

  // 2) For each category, fetch up to 4 products
  const categoriesWithProducts: {
    name: string;
    viewMoreHref: string;
    products: Product[];
  }[] = categoryMeta.map((cat) => ({
    name: cat.name,
    viewMoreHref: cat.viewMoreHref,
    products: getProductsByCategory(cat.slug).slice(0, 4),
  }));

  return (
    <section className="min-h-screen flex flex-col">
      <Header />
      <main className="w-full flex-1">
        <HeroSlider />
        <ProductShowcase categories={categoriesWithProducts} />
      </main>
      {/* Footer */}
    </section>
  );
}
