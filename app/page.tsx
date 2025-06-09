import HeroSlider from "@/components/HeroSlider";
import FeatureHighlights from "@/components/FeatureHighlights";
import ProductShowcase from "@/components/ProductShowcase";
import { Header } from "@/components/shared/header";
import { Metadata } from "next";
import { getProductsByCategory, Product } from "@/lib/products";
import Footer from "@/components/shared/footer";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
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
        <FeatureHighlights />
        <ProductShowcase categories={categoriesWithProducts} />
      </main>
      <Footer />
    </section>
  );
}
